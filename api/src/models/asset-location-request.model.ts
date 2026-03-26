// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { DataLayerDto } from './data-layer.model';
import { FeatureCollection, Polygon } from 'geojson';

export interface AssetLocationRequestDto {
    location: FeatureCollection<Polygon>;
    dataLayers: DataLayerDto[];
    maxIssues?: number;
    analysisMethod?: 'legacy' | 'weighted';
    reportMaxScoreForPolygon?: number;
    reportMaxRegions?: number;
}
