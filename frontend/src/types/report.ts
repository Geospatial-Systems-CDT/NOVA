// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { BBox, Feature, Polygon } from 'geojson';

export interface ReportIssueDTO {
    description: string;
    suitability: string;
}

export interface ReportRegionLayerValueDTO {
    layerId: string;
    label: string;
    value: number | null;
    unit: string;
}

export interface ReportRegionDTO {
    id: string;
    polygon: Feature<Polygon>;
    bbox: BBox;
    areaSqKm: number;
    issueCount: number;
    issues: ReportIssueDTO[];
    layerValues: ReportRegionLayerValueDTO[];
}

export interface ReportDTO {
    regions: ReportRegionDTO[];
    totalRegions: number;
}

export const CACHED_REPORT_STORAGE_KEY = 'nova-cached-report';
