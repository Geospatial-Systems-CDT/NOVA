// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { ReportDTO, ReportIssueDTO, ReportRegionLayerValueDTO } from '../types/report';
import { DEFAULT_SUITABILITY_THRESHOLDS, type SuitabilityThresholds } from '../types/reportRanking';

type ReportLayerSuitability = 'green' | 'amber' | 'red' | 'darkRed';

export interface ReportLayerFeatureProperties {
    reportRegionId: string;
    areaSqKm: number;
    issueCount: number;
    weightedIssueSum: number;
    totalLayerWeight: number;
    suitabilityScore: number;
    suitability: ReportLayerSuitability;
    analysisMethod: 'legacy' | 'weighted';
    weightedThresholdText: string | null;
    reportMaxScoreForPolygonUsed: number | null;
    issues: ReportIssueDTO[];
    layerValues: ReportRegionLayerValueDTO[];
    energyPotential: {
        solarAnnualMWh: number | null;
        windAnnualMWh: number | null;
        solarMaxAssets: number | null;
        windMaxAssets: number | null;
    };
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

function getWeightedThresholdText(score: number, thresholds: SuitabilityThresholds): string {
    if (score <= 0) return 'green (score <= 0.000)';
    if (score <= thresholds.amberMax) return `amber (score <= ${thresholds.amberMax.toFixed(3)})`;
    if (score <= thresholds.redMax) return `red (score <= ${thresholds.redMax.toFixed(3)})`;
    return `darkRed (score > ${thresholds.redMax.toFixed(3)})`;
}

export function mapReportToLayerFeatureCollection(
    report: ReportDTO,
    thresholds: SuitabilityThresholds = DEFAULT_SUITABILITY_THRESHOLDS
): FeatureCollection<Polygon, ReportLayerFeatureProperties> {
    const analysisMethod = report.analysisMethod === 'legacy' ? 'legacy' : 'weighted';
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
                analysisMethod === 'legacy'
                    ? getSuitabilityFromIssueCount(region.issueCount)
                    : getSuitabilityFromWeightedScore(region.suitabilityScore, thresholds),
            analysisMethod,
            weightedThresholdText: analysisMethod === 'weighted' ? getWeightedThresholdText(region.suitabilityScore, thresholds) : null,
            reportMaxScoreForPolygonUsed: report.reportMaxScoreForPolygonUsed,
            issues: region.issues,
            layerValues: region.layerValues,
            energyPotential: region.energyPotential,
        },
    }));

    return {
        type: 'FeatureCollection',
        features,
    };
}
