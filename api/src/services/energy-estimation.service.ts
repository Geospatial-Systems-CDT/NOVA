// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import * as turf from '@turf/turf';
import { DataProviderUtils } from '../utils/data-provider.utils';
import { AssetEstimationRequestDto } from '../models/asset-estimation-request.model';
import { AssetEstimationResponseDto, AssetTechnologyDto } from '../models/asset-estimation-response.model';

const HOURS_PER_YEAR = 8760;

const ENERGY_ASSUMPTIONS = {
    availabilityFactor: 0.97,
    lossesFactor: 0.12,
    defaultCapacityFactor: {
        wind: 0.34,
        solar: 0.14,
        unknown: 0.22,
    },
    defaultInstalledCapacityMW: {
        wind: 5,
        solar: 1,
        unknown: 2,
    },
    assumedSubstationHeadroomMW: 60,
    assumedLocalDemandMW: 8,
} as const;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const roundTo = (value: number, decimals: number): number => {
    const p = 10 ** decimals;
    return Math.round(value * p) / p;
};

const parseFirstNumber = (raw: unknown): number | null => {
    if (raw === null || raw === undefined) return null;
    const text = String(raw);
    const match = text.match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    const parsed = Number.parseFloat(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
};

const parsePowerToMW = (rawValue: string): number | null => {
    const n = parseFirstNumber(rawValue);
    if (n === null) return null;

    const value = rawValue.toLowerCase();
    if (value.includes('gw')) return n * 1000;
    if (value.includes('mw')) return n;
    if (value.includes('kw')) return n / 1000;
    if (value.includes('wp') || value.includes(' w')) return n / 1_000_000;

    return null;
};

const parseDistanceKm = (distanceText: unknown): number => {
    const parsed = parseFirstNumber(distanceText);
    if (parsed === null) return 0;
    return Math.max(parsed, 0);
};

const getTechnologyFromVariant = (variant: AssetEstimationRequestDto['variant']): AssetTechnologyDto => {
    if (!variant) return 'unknown';

    const searchable = [
        variant.name,
        variant.image,
        variant.icon,
        ...variant.specification.map((s) => s.name),
        ...variant.specification.map((s) => s.value),
    ]
        .join(' ')
        .toLowerCase();

    if (searchable.includes('wind') || searchable.includes('turbine') || searchable.includes('rotor') || searchable.includes('hub')) {
        return 'wind';
    }

    if (searchable.includes('solar') || searchable.includes('panel') || searchable.includes('irradiance') || searchable.includes('wp')) {
        return 'solar';
    }

    return 'unknown';
};

const getInstalledCapacityMW = (variant: AssetEstimationRequestDto['variant']): number => {
    const technology = getTechnologyFromVariant(variant);
    if (!variant) return ENERGY_ASSUMPTIONS.defaultInstalledCapacityMW[technology];

    const capacityLikeSpec = variant.specification.find((spec) => {
        const key = spec.name.toLowerCase();
        return key.includes('capacity') || key.includes('rated power') || key.includes('wattage');
    });

    const parsedMW = capacityLikeSpec ? parsePowerToMW(capacityLikeSpec.value) : null;

    if (parsedMW !== null && parsedMW >= 0.05) {
        return parsedMW;
    }

    if (technology === 'solar') {
        const label = variant.name.toLowerCase();
        if (label.includes('farm')) return 5;
        if (label.includes('roof')) return 0.35;
    }

    return ENERGY_ASSUMPTIONS.defaultInstalledCapacityMW[technology];
};

const getResourceAdjustedCapacityFactor = (technology: AssetTechnologyDto, latitude: number): number => {
    const base = ENERGY_ASSUMPTIONS.defaultCapacityFactor[technology];

    if (technology === 'solar') {
        const solarLatAdjustment = 1 - Math.max(0, latitude - 50) * 0.006;
        return clamp(base * solarLatAdjustment, 0.08, 0.25);
    }

    if (technology === 'wind') {
        const windLatAdjustment = 1 + (latitude - 54) * 0.004;
        return clamp(base * windLatAdjustment, 0.2, 0.6);
    }

    return clamp(base, 0.1, 0.4);
};

const getCapacityFactorFromSolarPotential = (solarPotentialKwhPerKwp: number | null): number | null => {
    if (!Number.isFinite(solarPotentialKwhPerKwp)) return null;

    const value = Number(solarPotentialKwhPerKwp);
    if (value <= 0) return null;

    return clamp(value / HOURS_PER_YEAR, 0.08, 0.25);
};

const getAnnualWindspeedMs = (properties: Record<string, unknown> | undefined): number | null => {
    if (!properties) return null;

    const seasonalKeys = ['ws_spring1', 'ws_summer1', 'ws_autumn1', 'ws_winter1'] as const;
    const seasonalValues = seasonalKeys
        .map((key) => Number(properties[key]))
        .filter((value) => Number.isFinite(value) && value > 0);

    if (seasonalValues.length === seasonalKeys.length) {
        const avg = seasonalValues.reduce((sum, current) => sum + current, 0) / seasonalValues.length;
        return Number.isFinite(avg) ? avg : null;
    }

    const fallback = Number(properties.ws_spring1);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : null;
};

const getCapacityFactorFromWindspeed = (windspeedMs: number | null): number | null => {
    if (!Number.isFinite(windspeedMs)) return null;

    const value = Number(windspeedMs);
    if (value <= 0) return null;

    // Approximate CF curve for utility-scale onshore wind in planning-stage screening.
    const rawCapacityFactor = 0.02 + 0.0065 * value ** 2;
    return clamp(rawCapacityFactor, 0.15, 0.6);
};

export class EnergyEstimationService {
    constructor(private readonly dataProviderUtils: DataProviderUtils) {}

    private getSolarPotentialAtLocation(longitude: number, latitude: number): number | null {
        const solarPotentialLayer = this.dataProviderUtils.getSolarPotentialLayerData();
        const targetPoint = turf.point([longitude, latitude]);

        for (const feature of solarPotentialLayer.features) {
            for (const coordinates of feature.geometry.coordinates) {
                const polygon = turf.polygon(coordinates);
                if (turf.booleanPointInPolygon(targetPoint, polygon)) {
                    const value = Number(feature.properties?.pv_annual_kwh_kwp);
                    return Number.isFinite(value) ? value : null;
                }
            }
        }

        return null;
    }

    private getWindspeedAtLocation(longitude: number, latitude: number): number | null {
        const windspeedLayer = this.dataProviderUtils.getWindspeedLayerData();
        const targetPoint = turf.point([longitude, latitude]);

        for (const feature of windspeedLayer.features) {
            for (const coordinates of feature.geometry.coordinates) {
                const polygon = turf.polygon(coordinates);
                if (turf.booleanPointInPolygon(targetPoint, polygon)) {
                    return getAnnualWindspeedMs(feature.properties as Record<string, unknown> | undefined);
                }
            }
        }

        return null;
    }

    public estimateAssetContribution(req: AssetEstimationRequestDto): AssetEstimationResponseDto {
        const { variant, selectedSubstation, latitude, longitude } = req;

        const technology = getTechnologyFromVariant(variant);
        const installedCapacityMW = getInstalledCapacityMW(variant);
        const connectionDistanceKm = parseDistanceKm(selectedSubstation.distanceFromTurbine);

        const solarPotentialKwhPerKwp = technology === 'solar' ? this.getSolarPotentialAtLocation(longitude, latitude) : null;
        const solarCapacityFactor = technology === 'solar' ? getCapacityFactorFromSolarPotential(solarPotentialKwhPerKwp) : null;
        const windspeedMs = technology === 'wind' ? this.getWindspeedAtLocation(longitude, latitude) : null;
        const windCapacityFactor = technology === 'wind' ? getCapacityFactorFromWindspeed(windspeedMs) : null;
        const capacityFactor = solarCapacityFactor ?? windCapacityFactor ?? getResourceAdjustedCapacityFactor(technology, latitude);

        const grossAnnualMWh = installedCapacityMW * HOURS_PER_YEAR * capacityFactor;
        const availableAnnualMWh = grossAnnualMWh * ENERGY_ASSUMPTIONS.availabilityFactor;
        const netAnnualMWh = availableAnnualMWh * (1 - ENERGY_ASSUMPTIONS.lossesFactor);

        const deliveryFactor = clamp(1 - connectionDistanceKm * 0.004, 0.75, 1);
        const deliveredMWh = netAnnualMWh * deliveryFactor;

        const outputMW = deliveredMWh / HOURS_PER_YEAR;
        const gridSupportFactor = clamp(1 - connectionDistanceKm * 0.012, 0.35, 1);
        const gridSupportMW = outputMW * gridSupportFactor;

        const boostPercent = clamp((gridSupportMW / ENERGY_ASSUMPTIONS.assumedSubstationHeadroomMW) * 100, 0, 100);
        const localBoostPercent = clamp((outputMW / ENERGY_ASSUMPTIONS.assumedLocalDemandMW) * 100, 0, 100);

        const idPrefix = technology === 'wind' ? 'WT' : technology === 'solar' ? 'SP' : 'AS';

        return {
            assetId: `${idPrefix}-${selectedSubstation.id}`,
            technology,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            connectedSubstation: selectedSubstation.name,
            connectionDistanceKm,
            outputMWh: roundTo(deliveredMWh, 0),
            outputMW: roundTo(outputMW, 2),
            gridSupportMW: roundTo(gridSupportMW, 2),
            boostPercent: roundTo(boostPercent, 1),
            localBoostPercent: roundTo(localBoostPercent, 1),
            maxOutputMWh: Math.max(roundTo(deliveredMWh * 1.35, 0), 1000),
            maxOutputMW: Math.max(roundTo(outputMW * 1.4, 2), 1),
            maxGridSupportMW: Math.max(roundTo(gridSupportMW * 1.4, 2), 1),
            maxBoostPercent: 100,
            maxLocalBoostPercent: 100,
        };
    }
}
