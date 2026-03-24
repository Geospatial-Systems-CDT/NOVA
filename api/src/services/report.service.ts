// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Feature, FeatureCollection, GeoJsonProperties, Geometry, MultiPolygon, Point, Polygon } from 'geojson';
import * as turf from '@turf/turf';
import { ReportDTO, ReportIssueDTO, ReportRegionDTO, ReportRegionLayerValueDTO } from '../models/report.model';
import { DataLayerDto } from '../models/data-layer.model';
import { DataProviderUtils } from '../utils/data-provider.utils';

/** Minimum area in m² below which a region is discarded as a geometric sliver */
const MIN_AREA_M2 = 1000;

interface IssueUnion {
    description: string;
    suitability: string;
    union: Feature<Polygon | MultiPolygon, GeoJsonProperties>;
}

/**
 * Service which post-processes a FeatureCollection (the output of AssetAnalysisService.analyzeLocation)
 * into a suitability report of candidate regions grouped by issue count.
 */
export class ReportService {
    constructor(private readonly dataProviderUtils?: DataProviderUtils) {}

    /**
     * Generate a report from an already-computed analysis FeatureCollection.
     *
     * @param analysisResult - The FeatureCollection returned by AssetAnalysisService.analyzeLocation.
     * @param maxIssues - Include regions with at most this many distinct issue types.
     * @param activeDataLayers - The data layers (with `analyze: true`) used during this analysis.
     */
    public generateReport(analysisResult: FeatureCollection<Geometry>, maxIssues: number, activeDataLayers: DataLayerDto[] = []): ReportDTO {
        // 1. Separate green baseline from issue features
        const greenFeature = analysisResult.features.find((f) => f.properties?.suitability === 'green') as
            | Feature<Polygon | MultiPolygon, GeoJsonProperties>
            | undefined;

        if (!greenFeature) {
            return { regions: [], totalRegions: 0 };
        }

        const issueFeatures = analysisResult.features.filter((f) => f.properties?.suitability !== 'green') as Feature<
            Polygon | MultiPolygon,
            GeoJsonProperties
        >[];

        // 2. Build one unioned polygon per distinct issue description
        const issueUnions = this.buildIssueUnions(issueFeatures);

        // 3. Enumerate combinations and build candidate regions
        const regions: ReportRegionDTO[] = [];
        let regionIndex = 1;

        for (let k = 0; k <= maxIssues; k++) {
            const combinations = this.getCombinations(issueUnions, k);

            for (const combo of combinations) {
                const otherUnions = issueUnions.filter((iu) => !combo.includes(iu));
                const candidateGeometry = this.computeCandidateGeometry(greenFeature, combo, otherUnions);

                if (!candidateGeometry) continue;

                const flattened = turf.flatten(candidateGeometry as Feature<Polygon | MultiPolygon>);

                for (const flat of flattened.features) {
                    const area = turf.area(flat);
                    if (area < MIN_AREA_M2) continue;

                    const issues: ReportIssueDTO[] = combo.map(({ description, suitability }) => ({
                        description,
                        suitability,
                    }));

                    const regionPolygon = flat as Feature<Polygon>;
                    const layerValues = this.computeLayerValuesForRegion(regionPolygon, activeDataLayers);

                    regions.push({
                        id: `region-${regionIndex++}`,
                        polygon: regionPolygon,
                        bbox: turf.bbox(flat),
                        areaSqKm: area / 1e6,
                        issueCount: combo.length,
                        issues,
                        layerValues,
                    });
                }
            }
        }

        return { regions, totalRegions: regions.length };
    }

    /**
     * Group issue features by their `properties.issue` description and return one
     * unioned polygon per distinct description. The `suitability` carried on the first
     * feature in each group is used for that group.
     */
    private buildIssueUnions(issueFeatures: Feature<Polygon | MultiPolygon, GeoJsonProperties>[]): IssueUnion[] {
        const groupMap = new Map<string, { suitability: string; features: Feature<Polygon | MultiPolygon, GeoJsonProperties>[] }>();

        for (const feature of issueFeatures) {
            const description = (feature.properties?.issue as string) ?? 'unknown';
            const suitability = (feature.properties?.suitability as string) ?? 'unknown';

            if (!groupMap.has(description)) {
                groupMap.set(description, { suitability, features: [] });
            }
            groupMap.get(description)!.features.push(feature);
        }

        const issueUnions: IssueUnion[] = [];

        groupMap.forEach(({ suitability, features }, description) => {
            const union = this.unionAll(features);
            if (union) {
                issueUnions.push({ description, suitability, union });
            }
        });

        return issueUnions;
    }

    /**
     * Compute the geometry for regions that have EXACTLY the issues in `combo`
     * and none of the issues in `otherUnions`.
     *
     * - If combo is empty: subtract all issue unions from the green area.
     * - If combo is non-empty: intersect the green area with each combo union,
     *   then subtract all other issue unions.
     *
     * Returns null if the result is empty (no such area exists).
     */
    private computeCandidateGeometry(
        greenFeature: Feature<Polygon | MultiPolygon, GeoJsonProperties>,
        combo: IssueUnion[],
        otherUnions: IssueUnion[]
    ): Feature<Polygon | MultiPolygon, GeoJsonProperties> | null {
        let region: Feature<Polygon | MultiPolygon, GeoJsonProperties> | null = greenFeature;

        // Intersect with each issue union in the combo
        for (const { union } of combo) {
            if (!region) return null;
            region = turf.intersect(turf.featureCollection([region, union]));
        }

        if (!region) return null;

        // Subtract all issue unions not in this combo
        for (const { union } of otherUnions) {
            if (!region) return null;
            region = turf.difference(turf.featureCollection([region, union]));
        }

        return region;
    }

    /**
     * Union an array of polygon features into a single feature.
     * Returns the first feature unchanged if the array has only one element.
     */
    private unionAll(features: Feature<Polygon | MultiPolygon, GeoJsonProperties>[]): Feature<Polygon | MultiPolygon, GeoJsonProperties> | null {
        if (features.length === 0) return null;
        if (features.length === 1) return features[0];

        let result: Feature<Polygon | MultiPolygon, GeoJsonProperties> | null = features[0];
        for (let i = 1; i < features.length; i++) {
            if (!result) return null;
            result = turf.union(turf.featureCollection([result, features[i]]));
        }
        return result;
    }

    /**
     * Return all size-k combinations from `arr` without repetition.
     */
    private getCombinations<T>(arr: T[], k: number): T[][] {
        if (k === 0) return [[]];
        if (arr.length < k) return [];

        const [first, ...rest] = arr;
        const withFirst = this.getCombinations(rest, k - 1).map((combo) => [first, ...combo]);
        const withoutFirst = this.getCombinations(rest, k);

        return [...withFirst, ...withoutFirst];
    }

    /**
     * Compute layer-specific values for the given candidate region polygon.
     * The ALC grade is always included when a data provider is available.
     * Additional values are computed for each active data layer.
     */
    private computeLayerValuesForRegion(region: Feature<Polygon>, activeDataLayers: DataLayerDto[]): ReportRegionLayerValueDTO[] {
        if (!this.dataProviderUtils) return [];

        const centroid = turf.centroid(region) as Feature<Point>;
        const results: ReportRegionLayerValueDTO[] = [];

        // Always include agricultural land classification
        const alcData = this.dataProviderUtils.getAgriculturalLandClassificationData();
        const alcValue = this.computeAlcGradeAtCentroid(centroid, alcData);
        results.push({ layerId: 'agriculturalLandClassification', label: 'Agricultural land classification', value: alcValue, unit: '' });

        for (const layer of activeDataLayers) {
            switch (layer.id) {
                case 'windSpeed': {
                    const data = this.dataProviderUtils.getWindspeedLayerData();
                    const value = this.computeGridValueAtCentroid(centroid, data, 'ws_spring1');
                    results.push({ layerId: 'windSpeed', label: 'Wind speed', value, unit: 'm/s' });
                    break;
                }
                case 'solarPotential': {
                    const data = this.dataProviderUtils.getSolarPotentialLayerData();
                    const value = this.computeGridValueAtCentroid(centroid, data, 'pv_annual_kwh_kwp');
                    results.push({ layerId: 'solarPotential', label: 'Solar potential', value, unit: 'kWh/kWp/year' });
                    break;
                }
                case 'sitesOfSpecialScientificInterest': {
                    const data = this.dataProviderUtils.getSitesOfSpecialScientificInterestLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'sitesOfSpecialScientificInterest', label: 'Distance to nearest SSSI boundary', value, unit: 'km' });
                    break;
                }
                case 'specialAreasOfConservation': {
                    const data = this.dataProviderUtils.getSpecialAreasOfConservationLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'specialAreasOfConservation', label: 'Distance to nearest SAC boundary', value, unit: 'km' });
                    break;
                }
                case 'builtUpAreas': {
                    const data = this.dataProviderUtils.getBuiltupAreasLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'builtUpAreas', label: 'Distance to nearest built-up area boundary', value, unit: 'km' });
                    break;
                }
                case 'areasOfOutstandingNaturalBeauty': {
                    const data = this.dataProviderUtils.getAreasOfNaturalBeautyLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'areasOfOutstandingNaturalBeauty', label: 'Distance to nearest AONB boundary', value, unit: 'km' });
                    break;
                }
            }
        }

        return results;
    }

    /**
     * Find the first ALC polygon that contains the given centroid point and return its
     * ALC_GRADE property as a string. Returns null when the centroid falls outside all polygons.
     */
    private computeAlcGradeAtCentroid(centroid: Feature<Point>, layerData: FeatureCollection<MultiPolygon>): string | null {
        for (const feature of layerData.features) {
            for (const coords of feature.geometry.coordinates) {
                const poly = turf.polygon(coords);
                if (turf.booleanPointInPolygon(centroid, poly)) {
                    const grade = feature.properties?.['ALC_GRADE'];
                    return typeof grade === 'string' ? grade : null;
                }
            }
        }
        return null;
    }

    /**
     * Find the first MultiPolygon grid cell that contains the given centroid point and return the
     * numeric value of `propertyKey` from its properties. Returns null when no cell matches.
     */
    private computeGridValueAtCentroid(centroid: Feature<Point>, layerData: FeatureCollection<MultiPolygon>, propertyKey: string): number | null {
        for (const feature of layerData.features) {
            for (const coords of feature.geometry.coordinates) {
                const poly = turf.polygon(coords);
                if (turf.booleanPointInPolygon(centroid, poly)) {
                    const val = feature.properties?.[propertyKey];
                    return typeof val === 'number' ? Math.round(val * 100) / 100 : null;
                }
            }
        }
        return null;
    }

    /**
     * Compute the minimum distance in kilometres from `centroid` to the nearest boundary of any
     * feature in `layerData`. Returns 0 when the centroid falls inside a feature, and null when
     * the layer has no features.
     */
    private computeDistanceToNearestBoundaryKm(centroid: Feature<Point>, layerData: FeatureCollection<MultiPolygon>): number | null {
        if (layerData.features.length === 0) return null;

        let minDistKm: number | null = null;

        for (const feature of layerData.features) {
            for (const coords of feature.geometry.coordinates) {
                const poly = turf.polygon(coords);
                if (turf.booleanPointInPolygon(centroid, poly)) {
                    return 0;
                }
                const outerRing = turf.lineString(coords[0]);
                const dist = turf.pointToLineDistance(centroid, outerRing, { units: 'kilometers' });
                if (minDistKm === null || dist < minDistKm) {
                    minDistKm = dist;
                }
            }
        }

        return minDistKm !== null ? Math.round(minDistKm * 100) / 100 : null;
    }
}
