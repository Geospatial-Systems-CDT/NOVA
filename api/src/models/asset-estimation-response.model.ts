// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export type AssetTechnologyDto = 'wind' | 'solar' | 'unknown';

export interface AssetEstimationResponseDto {
    assetId: string;
    technology: AssetTechnologyDto;
    location: string;
    connectedSubstation: string;
    connectionDistanceKm: number;
    outputMWh: number;
    outputMW: number;
    gridSupportMW: number;
    boostPercent: number;
    localBoostPercent: number;
    maxOutputMWh: number;
    maxOutputMW: number;
    maxGridSupportMW: number;
    maxBoostPercent: number;
    maxLocalBoostPercent: number;
}
