// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { describe, expect, it } from 'vitest';
import type { ReportDTO } from '../types/report';
import { DEFAULT_SUITABILITY_THRESHOLDS } from '../types/reportRanking';
import { mapReportToLayerFeatureCollection } from './reportLayerMapper';

const basePolygon = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
        type: 'Polygon' as const,
        coordinates: [
            [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
                [0, 0],
            ],
        ],
    },
};

describe('mapReportToLayerFeatureCollection', () => {
    it('maps report regions to feature collection with popup properties', () => {
        const report: ReportDTO = {
            analysisMethod: 'legacy',
            reportMaxScoreForPolygonUsed: null,
            regions: [
                {
                    id: 'region-1',
                    polygon: basePolygon,
                    bbox: [0, 0, 1, 1],
                    areaSqKm: 2.1234,
                    issueCount: 2,
                    weightedIssueSum: 1.5,
                    totalLayerWeight: 3,
                    suitabilityScore: 0.5,
                    issues: [{ description: 'Issue one', suitability: 'red' }],
                    layerValues: [{ layerId: 'wind', label: 'Wind', value: 7.5, unit: 'm/s' }],
                    energyPotential: {
                        solarAnnualMWh: 1200,
                        windAnnualMWh: 2200,
                        solarMaxAssets: 3,
                        windMaxAssets: 1,
                    },
                },
            ],
            totalRegions: 1,
            layerValues: [],
            assumptions: [],
        };

        const result = mapReportToLayerFeatureCollection(report, DEFAULT_SUITABILITY_THRESHOLDS);

        expect(result.type).toBe('FeatureCollection');
        expect(result.features).toHaveLength(1);
        expect(result.features[0].properties.reportRegionId).toBe('region-1');
        expect(result.features[0].properties.issueCount).toBe(2);
        expect(result.features[0].properties.suitabilityScore).toBe(0.5);
        expect(result.features[0].properties.layerValues[0].label).toBe('Wind');
        expect(result.features[0].properties.suitability).toBe('red');
        expect(result.features[0].properties.analysisMethod).toBe('legacy');
        expect(result.features[0].properties.weightedThresholdText).toBeNull();
    });

    it('maps zero-issue regions to green suitability using weighted mode', () => {
        const report: ReportDTO = {
            analysisMethod: 'weighted',
            reportMaxScoreForPolygonUsed: 1,
            regions: [
                {
                    id: 'region-2',
                    polygon: basePolygon,
                    bbox: [0, 0, 1, 1],
                    areaSqKm: 1,
                    issueCount: 0,
                    weightedIssueSum: 0,
                    totalLayerWeight: 2,
                    suitabilityScore: 0,
                    issues: [],
                    layerValues: [],
                    energyPotential: {
                        solarAnnualMWh: 500,
                        windAnnualMWh: 800,
                        solarMaxAssets: 1,
                        windMaxAssets: 0,
                    },
                },
            ],
            totalRegions: 1,
            layerValues: [],
            assumptions: [],
        };

        const result = mapReportToLayerFeatureCollection(report, DEFAULT_SUITABILITY_THRESHOLDS);
        expect(result.features[0].properties.suitability).toBe('green');
    });

    it('maps weighted score to amber/red/darkRed using configured thresholds', () => {
        const report: ReportDTO = {
            analysisMethod: 'weighted',
            reportMaxScoreForPolygonUsed: 1,
            regions: [
                {
                    id: 'region-amber',
                    polygon: basePolygon,
                    bbox: [0, 0, 1, 1],
                    areaSqKm: 1,
                    issueCount: 1,
                    weightedIssueSum: 0.2,
                    totalLayerWeight: 1,
                    suitabilityScore: 0.2,
                    issues: [],
                    layerValues: [],
                },
                {
                    id: 'region-red',
                    polygon: basePolygon,
                    bbox: [0, 0, 1, 1],
                    areaSqKm: 1,
                    issueCount: 2,
                    weightedIssueSum: 0.5,
                    totalLayerWeight: 1,
                    suitabilityScore: 0.5,
                    issues: [],
                    layerValues: [],
                },
                {
                    id: 'region-dark-red',
                    polygon: basePolygon,
                    bbox: [0, 0, 1, 1],
                    areaSqKm: 1,
                    issueCount: 3,
                    weightedIssueSum: 0.9,
                    totalLayerWeight: 1,
                    suitabilityScore: 0.9,
                    issues: [],
                    layerValues: [],
                },
            ],
            totalRegions: 3,
            layerValues: [],
            assumptions: [],
        };

        const result = mapReportToLayerFeatureCollection(report, { amberMax: 0.33, redMax: 0.66, reportMaxScoreForPolygon: 1, reportMaxRegions: 20 });

        expect(result.features[0].properties.suitability).toBe('amber');
        expect(result.features[1].properties.suitability).toBe('red');
        expect(result.features[2].properties.suitability).toBe('darkRed');
        expect(result.features[1].properties.weightedThresholdText).toBe('red (score <= 0.660)');
    });

    it('still supports legacy issue-count suitability mapping', () => {
        const report: ReportDTO = {
            analysisMethod: 'legacy',
            reportMaxScoreForPolygonUsed: null,
            regions: [
                {
                    id: 'region-legacy',
                    polygon: basePolygon,
                    bbox: [0, 0, 1, 1],
                    areaSqKm: 1,
                    issueCount: 1,
                    weightedIssueSum: 0.9,
                    totalLayerWeight: 1,
                    suitabilityScore: 0.9,
                    issues: [],
                    layerValues: [],
                },
            ],
            totalRegions: 1,
            layerValues: [],
            assumptions: [],
        };

        const result = mapReportToLayerFeatureCollection(report, DEFAULT_SUITABILITY_THRESHOLDS);
        expect(result.features[0].properties.suitability).toBe('amber');
    });
});
