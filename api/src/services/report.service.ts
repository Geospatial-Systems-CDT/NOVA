// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Feature, FeatureCollection, GeoJsonProperties, Geometry, MultiPolygon, Point, Polygon } from 'geojson';
import * as turf from '@turf/turf';
import { performance } from 'perf_hooks';
import { ReportAssumptionDTO, ReportDTO, ReportIssueDTO, ReportRegionDTO, ReportRegionLayerValueDTO } from '../models/report.model';
import { DataLayerDto } from '../models/data-layer.model';
import { DataProviderUtils } from '../utils/data-provider.utils';

/** Minimum area in m² below which a region is discarded as a geometric sliver (0.01 km²) */
const MIN_AREA_M2 = 10000;

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
     * @param dataLayers - All data layers submitted in the analysis request (both analyzed and non-analyzed).
     *                     Used to derive `assumptions` and `layerValues` for analyze=true layers only.
     * @param selectedPolygon - The polygon drawn by the user, or null.
     */
    public generateReport(
        analysisResult: FeatureCollection<Geometry>,
        maxIssues: number,
        dataLayers: DataLayerDto[] = [],
        selectedPolygon: Feature<Polygon> | null = null
    ): ReportDTO {
        const activeDataLayers = dataLayers.filter((l) => l.analyze);
        const assumptions = this.buildAssumptions(dataLayers);
        const _t0 = performance.now();

        // 1. Separate green baseline from issue features
        let greenFeature = analysisResult.features.find((f) => f.properties?.suitability === 'green') as
            | Feature<Polygon | MultiPolygon, GeoJsonProperties>
            | undefined;

        if (!greenFeature) {
            return { regions: [], totalRegions: 0, selectedPolygon, assumptions };
        }

        // 1a. Clip the green baseline to the IoW coastline so that all downstream
        //     candidate geometries are automatically land-only. Doing this once here
        //     is far cheaper than intersecting every candidate region individually.
        if (this.dataProviderUtils) {
            const _tCoastline = performance.now();
            const coastlineFeatures = this.dataProviderUtils.getCoastlineData().features as Feature<Polygon | MultiPolygon, GeoJsonProperties>[];
            const coastlineUnion = this.unionAll(coastlineFeatures);
            if (coastlineUnion) {
                const clipped = turf.intersect(turf.featureCollection([greenFeature, this.simplifyFeature(coastlineUnion)]));
                if (!clipped) {
                    return { regions: [], totalRegions: 0, selectedPolygon, assumptions };
                }
                greenFeature = this.simplifyFeature(clipped as Feature<Polygon | MultiPolygon, GeoJsonProperties>);
            }
            console.debug(`[generateReport] coastline clip: ${(performance.now() - _tCoastline).toFixed(1)}ms`);
        }

        const issueFeatures = analysisResult.features.filter((f) => f.properties?.suitability !== 'green') as Feature<
            Polygon | MultiPolygon,
            GeoJsonProperties
        >[];

        // 2. Build one unioned polygon per distinct issue description
        const _tUnions = performance.now();
        const issueUnions = this.buildIssueUnions(issueFeatures);
        console.debug(`[generateReport] buildIssueUnions (${issueUnions.length} distinct issues): ${(performance.now() - _tUnions).toFixed(1)}ms`);

        // 3. Enumerate exact-k combinations and build one candidate region per combination.
        //    Each combination produces a geometry that has EXACTLY those issues and no others,
        //    so flattened sub-polygons are naturally bounded by issue edges.
        const regions: ReportRegionDTO[] = [];
        let regionIndex = 1;
        let _tLayerValuesTotal = 0;

        const _tCombos = performance.now();
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
                    const _tLV = performance.now();
                    const layerValues = this.computeLayerValuesForRegion(regionPolygon, activeDataLayers);
                    _tLayerValuesTotal += performance.now() - _tLV;

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
        console.debug(`[generateReport] combinations loop (${regions.length} regions): ${(performance.now() - _tCombos).toFixed(1)}ms`);
        console.debug(`[generateReport] computeLayerValuesForRegion total: ${_tLayerValuesTotal.toFixed(1)}ms`);
        console.debug(`[generateReport] total: ${(performance.now() - _t0).toFixed(1)}ms`);

        return { regions, totalRegions: regions.length, selectedPolygon, assumptions };
    }

    /**
     * Build the list of assumptions from all submitted data layers.
     * - Layers that are constrained (analyze=true) and have labelled attributes → one row per attribute.
     * - All other layers (not analyzed, or analyzed but no attributes) → one row using the layer's
     *   display name as the label and an empty string as the value, so they still appear in the report.
     */
    private buildAssumptions(dataLayers: DataLayerDto[]): ReportAssumptionDTO[] {
        const assumptions: ReportAssumptionDTO[] = [];
        for (const layer of dataLayers) {
            const labelledAttrs = layer.attributes.filter((a) => !!a.label);
            if (layer.analyze && labelledAttrs.length > 0) {
                for (const attr of labelledAttrs) {
                    assumptions.push({
                        layerId: layer.id,
                        attributeId: attr.id,
                        label: attr.label!,
                        value: attr.value,
                    });
                }
            } else {
                assumptions.push({
                    layerId: layer.id,
                    attributeId: '',
                    label: layer.name ?? layer.id,
                    value: '',
                });
            }
        }
        return assumptions;
    }

    /**
     * Group issue features by their `properties.issue` description and return one
     * unioned polygon per distinct description. The union defines the exact boundary
     * for that issue type — required so that flattened sub-regions align cleanly with
     * issue edges and can be correctly annotated.
     */
    private buildIssueUnions(issueFeatures: Feature<Polygon | MultiPolygon, GeoJsonProperties>[]): IssueUnion[] {
        const groupMap = new Map<string, { suitability: string; features: Feature<Polygon | MultiPolygon, GeoJsonProperties>[] }>();

        for (const feature of issueFeatures) {
            const description = (feature.properties?.issue as string) ?? 'unknown';
            if (description === 'Unsuitable land') {
                // The imported unsuitable-land mask can be extremely detailed.
                // Excluding it from combinatorial report splitting avoids stack overflows
                // in downstream polygon operations while preserving heatmap behavior.
                continue;
            }
            const suitability = (feature.properties?.suitability as string) ?? 'unknown';
            if (!groupMap.has(description)) {
                groupMap.set(description, { suitability, features: [] });
            }
            groupMap.get(description)!.features.push(feature);
        }

        const issueUnions: IssueUnion[] = [];
        groupMap.forEach(({ suitability, features }, description) => {
            const union = this.unionAll(features);
            // Simplify once here so all downstream polygon boolean ops work on reduced-vertex geometry
            if (union) issueUnions.push({ description, suitability, union: this.simplifyFeature(union) });
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
            // Fast reject before the expensive intersect
            if (!this.bboxesOverlap(turf.bbox(region), turf.bbox(union))) return null;
            try {
                region = turf.intersect(turf.featureCollection([region, union]));
            } catch {
                return null;
            }
        }

        if (!region) return null;

        // Subtract all issue unions not in this combo
        for (const { union } of otherUnions) {
            if (!region) return null;
            if (!this.bboxesOverlap(turf.bbox(region), turf.bbox(union))) continue;
            try {
                region = turf.difference(turf.featureCollection([region, union]));
            } catch {
                // degenerate geometry — treat as no remaining area
                return null;
            }
        }

        return region;
    }

    /**
     * Simplify a polygon/multipolygon feature to reduce vertex count.
     * Uses a tolerance of 0.0001° (~11 m) which is imperceptible at report scale
     * but dramatically reduces the risk of polygon-clipping library stack overflows
     * on high-detail geometries (coastline, SAC/SSSI buffers, etc.).
     */
    private simplifyFeature<T extends Polygon | MultiPolygon>(
        feature: Feature<T, GeoJsonProperties>
    ): Feature<T, GeoJsonProperties> {
        try {
            return turf.simplify(feature, { tolerance: 0.0001, highQuality: false, mutate: false }) as Feature<T, GeoJsonProperties>;
        } catch {
            return feature;
        }
    }

    /** Returns true when two [west,south,east,north] bounding boxes overlap. */
    private bboxesOverlap(a: number[], b: number[]): boolean {
        return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
    }

    /**
     * Union an array of polygon features into a single feature using divide-and-conquer.
     * This keeps intermediate geometries balanced in size, avoiding the O(N) chain of
     * ever-growing unions produced by a sequential left-fold.
     */
    private unionAll(features: Feature<Polygon | MultiPolygon, GeoJsonProperties>[]): Feature<Polygon | MultiPolygon, GeoJsonProperties> | null {
        if (features.length === 0) return null;
        if (features.length === 1) return features[0];
        if (features.length === 2) return turf.union(turf.featureCollection([features[0], features[1]]));

        const mid = Math.floor(features.length / 2);
        const left = this.unionAll(features.slice(0, mid));
        const right = this.unionAll(features.slice(mid));
        if (!left) return right;
        if (!right) return left;
        return turf.union(turf.featureCollection([left, right]));
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
     * Values are computed only for active data layers.
     */
    private computeLayerValuesForRegion(region: Feature<Polygon>, activeDataLayers: DataLayerDto[]): ReportRegionLayerValueDTO[] {
        if (!this.dataProviderUtils) return [];

        const centroid = turf.pointOnFeature(region) as Feature<Point>;
        const results: ReportRegionLayerValueDTO[] = [];

        // Always include nearest substation name and distance
        const substationData = this.dataProviderUtils.readGridSupplyPointData();
        const nearestSubstation = this.computeNearestSubstation(centroid, substationData);
        results.push({ layerId: 'nearestSubstationName', label: 'Nearest substation', value: nearestSubstation?.name ?? null, unit: '' });
        results.push({
            layerId: 'nearestSubstationDistance',
            label: 'Distance to nearest substation',
            value: nearestSubstation?.distanceKm ?? null,
            unit: 'km',
        });

        for (const layer of activeDataLayers) {
            switch (layer.id) {
                case 'agriculturalLandClassification': {
                    const alcData = this.dataProviderUtils.getAgriculturalLandClassificationData();
                    const alcValue = this.computeAlcGradeAtCentroid(centroid, alcData);
                    results.push({ layerId: 'agriculturalLandClassification', label: 'Agricultural land classification', value: alcValue, unit: '' });
                    break;
                }
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
                case 'scheduledAncientMonuments750mBuffer': {
                    const data = this.dataProviderUtils.getScheduledAncientMonuments750mBufferLayerData() as unknown as FeatureCollection<MultiPolygon>;
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({
                        layerId: 'scheduledAncientMonuments750mBuffer',
                        label: 'Distance to nearest Scheduled Ancient Monument buffer',
                        value,
                        unit: 'km',
                    });
                    break;
                }
                case 'specialProtectionAreas2kmBuffer': {
                    const data = this.dataProviderUtils.getSpecialProtectionAreas2kmBufferLayerData() as unknown as FeatureCollection<MultiPolygon>;
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'specialProtectionAreas2kmBuffer', label: 'Distance to nearest SPA boundary', value, unit: 'km' });
                    break;
                }
                case 'ramsarWetlands': {
                    const data = this.dataProviderUtils.getRamsarWetlandsLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'ramsarWetlands', label: 'Distance to nearest Ramsar Wetland boundary', value, unit: 'km' });
                    break;
                }
                case 'coastalErosionProjection': {
                    const data = this.dataProviderUtils.getCoastalErosionProjectionLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'coastalErosionProjection', label: 'Distance to nearest coastal erosion zone', value, unit: 'km' });
                    break;
                }
                case 'fuelPoverty': {
                    const data = this.dataProviderUtils.getFuelPovertyLayerData() as unknown as FeatureCollection<MultiPolygon>;
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'fuelPoverty', label: 'Distance to nearest fuel poverty area boundary', value, unit: 'km' });
                    break;
                }
                case 'dissolvedRiverFloodRisk': {
                    const data = this.dataProviderUtils.getDissolvedRiverFloodRiskLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'dissolvedRiverFloodRisk', label: 'Distance to nearest river flood risk zone', value, unit: 'km' });
                    break;
                }
                case 'roadBufferSolar': {
                    const data = this.dataProviderUtils.getRoadBufferSolar7mLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'roadBufferSolar', label: 'Distance to nearest road solar buffer boundary', value, unit: 'km' });
                    break;
                }
                case 'railBufferSolar': {
                    const data = this.dataProviderUtils.getRailBufferSolarLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'railBufferSolar', label: 'Distance to nearest railway solar buffer boundary', value, unit: 'km' });
                    break;
                }
                case 'aspect': {
                    const data = this.dataProviderUtils.getAspectLayerData() as unknown as FeatureCollection<MultiPolygon>;
                    const value = this.computeGridValueAtCentroid(centroid, data, 'aspect');
                    results.push({ layerId: 'aspect', label: 'Aspect', value, unit: '' });
                    break;
                }
                case 'unsuitableLand': {
                    const data = this.dataProviderUtils.getUnsuitableLandLayerData();
                    const value = this.isPointInsideLayer(centroid, data) ? 'Yes' : 'No';
                    results.push({ layerId: 'unsuitableLand', label: 'Within unsuitable land', value, unit: '' });
                    break;
                }
            }
        }

        return results;
    }

    /**
     * Find the nearest grid supply point to the given centroid and return its display name
     * and distance in kilometres. Returns null when the dataset has no features.
     */
    private computeNearestSubstation(centroid: Feature<Point>, substationData: FeatureCollection): { name: string; distanceKm: number } | null {
        if (substationData.features.length === 0) return null;

        let nearest: { name: string; distanceKm: number } | null = null;

        for (const feature of substationData.features) {
            if (feature.geometry?.type !== 'Point') continue;
            const to = turf.point((feature.geometry as Point).coordinates);
            const dist = turf.distance(centroid, to, { units: 'kilometers' });
            if (nearest === null || dist < nearest.distanceKm) {
                const props = feature.properties ?? {};
                const name =
                    [props['Locality'], props['Operating Area'], props['Owner Name']]
                        .filter((part): part is string => typeof part === 'string' && part !== '')
                        .join('-') || 'Unknown';
                nearest = { name, distanceKm: Math.round(dist * 100) / 100 };
            }
        }

        return nearest;
    }

    /**
     * Find the first ALC polygon that contains the given centroid point and return its
     * ALC_GRADE property as a string. Returns null when the centroid falls outside all polygons.
     */
    private computeAlcGradeAtCentroid(centroid: Feature<Point>, layerData: FeatureCollection<MultiPolygon>): string | null {
        const [cLng, cLat] = centroid.geometry.coordinates;
        for (const feature of layerData.features) {
            const fb = turf.bbox(feature);
            // Point-in-bbox fast reject
            if (cLng < fb[0] || cLng > fb[2] || cLat < fb[1] || cLat > fb[3]) continue;
            for (const coords of feature.geometry.coordinates) {
                try {
                    const poly = turf.polygon(coords);
                    if (turf.booleanPointInPolygon(centroid, poly)) {
                        const grade = feature.properties?.['ALC_GRADE'];
                        return typeof grade === 'string' ? grade : null;
                    }
                } catch {
                    // degenerate ring — skip
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
        const [cLng, cLat] = centroid.geometry.coordinates;
        for (const feature of layerData.features) {
            const fb = turf.bbox(feature);
            // Point-in-bbox fast reject
            if (cLng < fb[0] || cLng > fb[2] || cLat < fb[1] || cLat > fb[3]) continue;
            for (const coords of feature.geometry.coordinates) {
                try {
                    const poly = turf.polygon(coords);
                    if (turf.booleanPointInPolygon(centroid, poly)) {
                        const val = feature.properties?.[propertyKey];
                        return typeof val === 'number' ? Math.round(val * 100) / 100 : null;
                    }
                } catch {
                    // degenerate ring — skip
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
        const [cLng, cLat] = centroid.geometry.coordinates;

        for (const feature of layerData.features) {
            // Feature-level bbox lower-bound: if the closest point on the bbox is already
            // farther than the current best, the full geometry can't beat it.
            const fb = turf.bbox(feature);
            const fbDxDeg = Math.max(fb[0] - cLng, 0, cLng - fb[2]);
            const fbDyDeg = Math.max(fb[1] - cLat, 0, cLat - fb[3]);
            const fbLowerBoundKm = Math.sqrt(fbDxDeg * fbDxDeg + fbDyDeg * fbDyDeg) * 111;
            if (minDistKm !== null && fbLowerBoundKm >= minDistKm) continue;

            for (const coords of feature.geometry.coordinates) {
                // Sub-polygon bbox lower-bound
                const outerRing = coords[0];
                let minLng = Infinity,
                    minLat = Infinity,
                    maxLng = -Infinity,
                    maxLat = -Infinity;
                for (const c of outerRing) {
                    if (c[0] < minLng) minLng = c[0];
                    if (c[0] > maxLng) maxLng = c[0];
                    if (c[1] < minLat) minLat = c[1];
                    if (c[1] > maxLat) maxLat = c[1];
                }
                const sDxDeg = Math.max(minLng - cLng, 0, cLng - maxLng);
                const sDyDeg = Math.max(minLat - cLat, 0, cLat - maxLat);
                const sLowerBoundKm = Math.sqrt(sDxDeg * sDxDeg + sDyDeg * sDyDeg) * 111;
                if (minDistKm !== null && sLowerBoundKm >= minDistKm) continue;

                try {
                    const poly = turf.polygon(coords);
                    if (turf.booleanPointInPolygon(centroid, poly)) {
                        return 0;
                    }
                } catch {
                    // degenerate ring — fall through to line distance
                }
                try {
                    const outerLineString = turf.lineString(outerRing);
                    const dist = turf.pointToLineDistance(centroid, outerLineString, { units: 'kilometers' });
                    if (minDistKm === null || dist < minDistKm) {
                        minDistKm = dist;
                    }
                } catch {
                    // degenerate ring — skip
                }
            }
        }

        return minDistKm !== null ? Math.round(minDistKm * 100) / 100 : null;
    }

    private isPointInsideLayer(centroid: Feature<Point>, layerData: FeatureCollection<MultiPolygon | Polygon>): boolean {
        for (const feature of layerData.features) {
            const geometry = feature.geometry;
            if (geometry.type === 'Polygon') {
                const polygon = turf.polygon(geometry.coordinates);
                if (turf.booleanPointInPolygon(centroid, polygon)) return true;
                continue;
            }

            if (geometry.type === 'MultiPolygon') {
                for (const coordinates of geometry.coordinates) {
                    const polygon = turf.polygon(coordinates);
                    if (turf.booleanPointInPolygon(centroid, polygon)) return true;
                }
            }
        }

        return false;
    }
}
