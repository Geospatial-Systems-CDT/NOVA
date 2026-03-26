// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { ReportDTO, ReportIssueDTO, ReportRegionLayerValueDTO } from '../types/report';
import { DEFAULT_SUITABILITY_THRESHOLDS, type ReportRankingMode, type SuitabilityThresholds } from '../types/reportRanking';

type ReportLayerSuitability = 'green' | 'amber' | 'red' | 'darkRed';

export interface ReportLayerFeatureProperties {
    reportRegionId: string;
    areaSqKm: number;
    issueCount: number;
    weightedIssueSum: number;
    totalLayerWeight: number;
    suitabilityScore: number;
    suitability: ReportLayerSuitability;
    issues: ReportIssueDTO[];
    layerValues: ReportRegionLayerValueDTO[];
}

function getSuitabilityFromIssueCount(issueCount: number): ReportLayerSuitability {
    if (issueCount <= 0) return 'green';
    if (issueCount === 1) return 'amber';
    if (issueCount === 2) return 'red';
    return 'darkRed';
}

function getSuitabilityFromWeightedScore(score: number, thresholds: SuitabilityThresholds): ReportLayerSuitability {
    if (score <= 0) return 'green';
    if (score <= thresholds.amberMax) return 'amber';
    if (score <= thresholds.redMax) return 'red';
    return 'darkRed';
}

export function mapReportToLayerFeatureCollection(
    report: ReportDTO,
    rankingMode: ReportRankingMode,
    thresholds: SuitabilityThresholds = DEFAULT_SUITABILITY_THRESHOLDS
): FeatureCollection<Polygon, ReportLayerFeatureProperties> {
    const features: Feature<Polygon, ReportLayerFeatureProperties>[] = report.regions.map((region) => ({
        type: 'Feature',
        geometry: region.polygon.geometry,
        properties: {
            reportRegionId: region.id,
            areaSqKm: region.areaSqKm,
            issueCount: region.issueCount,
            weightedIssueSum: region.weightedIssueSum,
            totalLayerWeight: region.totalLayerWeight,
            suitabilityScore: region.suitabilityScore,
            suitability:
                rankingMode === 'legacyIssueCount'
                    ? getSuitabilityFromIssueCount(region.issueCount)
                    : getSuitabilityFromWeightedScore(region.suitabilityScore, thresholds),
            issues: region.issues,
            layerValues: region.layerValues,
        },
    }));

    return {
        type: 'FeatureCollection',
        features,
    };
}
