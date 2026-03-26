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
    ancientWoodlands: 'Distance to ancient woodland',
    scheduledAncientMonuments750mBuffer: 'Distance to SAM buffer',
    specialProtectionAreas2kmBuffer: 'Distance to SPA buffer',
    ramsarWetlands: 'Distance to Ramsar Wetland',
    coastalErosionProjection: 'Distance to coastal erosion',
    fuelPoverty: 'Distance to fuel poverty area',
    dissolvedRiverFloodRisk: 'Distance to flood risk',
    roadBuffer: 'Distance to road buffer',
    roadBufferSolar: 'Distance to road (solar)',
    railBuffer: 'Distance to rail buffer',
    railBufferSolar: 'Distance to rail (solar)',
    slope: 'Slope',
    aspect: 'Aspect',
};

export function getSlideLayerLabel(layerId: string, fallback: string): string {
    return LAYER_LABEL_OVERRIDES[layerId] ?? fallback;
}
