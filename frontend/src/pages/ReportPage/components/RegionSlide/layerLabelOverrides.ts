// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/**
 * Short display labels for layer values on space-constrained slide views.
 * Keyed by layerId. Falls back to the full API-provided label when not present.
 */
const LAYER_LABEL_OVERRIDES: Record<string, string> = {
    agriculturalLandClassification: 'ALC Grade',
    nearestSubstationName: 'Nearest substation',
    nearestSubstationDistance: 'Distance to substation',
    windSpeed: 'Wind speed',
    solarPotential: 'Solar potential',
    sitesOfSpecialScientificInterest: 'Distance to SSSI',
    specialAreasOfConservation: 'Distance to SAC',
    builtUpAreas: 'Distance to built-up area',
    areasOfOutstandingNaturalBeauty: 'Distance to AONB',
};

export function getSlideLayerLabel(layerId: string, fallback: string): string {
    return LAYER_LABEL_OVERRIDES[layerId] ?? fallback;
}
