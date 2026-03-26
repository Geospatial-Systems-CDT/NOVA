// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { describe, expect, it } from 'vitest';
import type { ReportDTO } from '../types/report';
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
            regions: [
                {
                    id: 'region-1',
                    polygon: basePolygon,
                    bbox: [0, 0, 1, 1],
                    areaSqKm: 2.1234,
                    issueCount: 2,
                    issues: [{ description: 'Issue one', suitability: 'red' }],
                    layerValues: [{ layerId: 'wind', label: 'Wind', value: 7.5, unit: 'm/s' }],
                },
            ],
            totalRegions: 1,
            layerValues: [],
            assumptions: [],
        };

        const result = mapReportToLayerFeatureCollection(report);

        expect(result.type).toBe('FeatureCollection');
        expect(result.features).toHaveLength(1);
        expect(result.features[0].properties.reportRegionId).toBe('region-1');
        expect(result.features[0].properties.issueCount).toBe(2);
        expect(result.features[0].properties.layerValues[0].label).toBe('Wind');
        expect(result.features[0].properties.suitability).toBe('red');
    });

    it('maps zero-issue regions to green suitability', () => {
        const report: ReportDTO = {
            regions: [
                {
                    id: 'region-2',
                    polygon: basePolygon,
                    bbox: [0, 0, 1, 1],
                    areaSqKm: 1,
                    issueCount: 0,
                    issues: [],
                    layerValues: [],
                },
            ],
            totalRegions: 1,
            layerValues: [],
            assumptions: [],
        };

        const result = mapReportToLayerFeatureCollection(report);
        expect(result.features[0].properties.suitability).toBe('green');
    });
});
