// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Feature, FeatureCollection, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from 'geojson';
import * as turf from '@turf/turf';
import { ReportDTO, ReportIssueDTO, ReportRegionDTO } from '../models/report.model';

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
    /**
     * Generate a report from an already-computed analysis FeatureCollection.
     *
     * @param analysisResult - The FeatureCollection returned by AssetAnalysisService.analyzeLocation.
     * @param maxIssues - Include regions with at most this many distinct issue types.
     */
    public generateReport(analysisResult: FeatureCollection<Geometry>, maxIssues: number): ReportDTO {
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

                    regions.push({
                        id: `region-${regionIndex++}`,
                        polygon: flat as Feature<Polygon>,
                        bbox: turf.bbox(flat),
                        areaSqKm: area / 1e6,
                        issueCount: combo.length,
                        issues,
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
}
