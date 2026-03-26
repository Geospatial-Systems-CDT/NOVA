// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export type AnalysisMethod = 'weighted' | 'legacy';

export interface SuitabilityThresholds {
    amberMax: number;
    redMax: number;
    reportMaxScoreForPolygon: number;
    reportMaxRegions: number;
}

export const DEFAULT_SUITABILITY_THRESHOLDS: SuitabilityThresholds = {
    amberMax: 0.33,
    redMax: 0.66,
    reportMaxScoreForPolygon: 1,
    reportMaxRegions: 20,
};

export async function loadSuitabilityThresholds(): Promise<SuitabilityThresholds> {
    try {
        const response = await fetch('/data/report-suitability-thresholds.json');
        if (!response.ok) return DEFAULT_SUITABILITY_THRESHOLDS;

        const payload = (await response.json()) as Partial<SuitabilityThresholds>;
        const amberMax = Number(payload.amberMax);
        const redMax = Number(payload.redMax);
        const reportMaxScoreForPolygon = Number(payload.reportMaxScoreForPolygon);
        const reportMaxRegions = Number(payload.reportMaxRegions);

        if (!Number.isFinite(amberMax) || !Number.isFinite(redMax) || !Number.isFinite(reportMaxScoreForPolygon) || !Number.isFinite(reportMaxRegions)) {
            return DEFAULT_SUITABILITY_THRESHOLDS;
        }

        if (amberMax < 0 || redMax < amberMax || reportMaxScoreForPolygon < 0 || reportMaxRegions < 1) {
            return DEFAULT_SUITABILITY_THRESHOLDS;
        }

        return { amberMax, redMax, reportMaxScoreForPolygon, reportMaxRegions: Math.floor(reportMaxRegions) };
    } catch {
        return DEFAULT_SUITABILITY_THRESHOLDS;
    }
}
