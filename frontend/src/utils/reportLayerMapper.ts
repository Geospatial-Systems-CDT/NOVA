// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { ReportDTO, ReportIssueDTO, ReportRegionLayerValueDTO } from '../types/report';

type ReportLayerSuitability = 'green' | 'amber' | 'red' | 'darkRed';

export interface ReportLayerFeatureProperties {
    reportRegionId: string;
    areaSqKm: number;
    issueCount: number;
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

export function mapReportToLayerFeatureCollection(report: ReportDTO): FeatureCollection<Polygon, ReportLayerFeatureProperties> {
    const features: Feature<Polygon, ReportLayerFeatureProperties>[] = report.regions.map((region) => ({
        type: 'Feature',
        geometry: region.polygon.geometry,
        properties: {
            reportRegionId: region.id,
            areaSqKm: region.areaSqKm,
            issueCount: region.issueCount,
            suitability: getSuitabilityFromIssueCount(region.issueCount),
            issues: region.issues,
            layerValues: region.layerValues,
        },
    }));

    return {
        type: 'FeatureCollection',
        features,
    };
}
