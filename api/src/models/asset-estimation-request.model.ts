// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export interface EstimationSpecificationDto {
    name: string;
    value: string;
}

export interface EstimationVariationDto {
    name: string;
    specification: EstimationSpecificationDto[];
    image: string;
    icon: string;
}

export interface EstimationSubstationDto {
    id: number;
    name: string;
    distanceFromTurbine: string | number;
    coordinates: number[];
}

export interface AssetEstimationRequestDto {
    variant: EstimationVariationDto | null;
    selectedSubstation: EstimationSubstationDto;
    latitude: number;
    longitude: number;
    solarOrientation?: string;
}
