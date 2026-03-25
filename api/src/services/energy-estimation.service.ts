// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import * as turf from '@turf/turf';
import { DataProviderUtils } from '../utils/data-provider.utils';
import { AssetEstimationRequestDto } from '../models/asset-estimation-request.model';
import { AssetEstimationResponseDto, AssetTechnologyDto } from '../models/asset-estimation-response.model';

const HOURS_PER_YEAR = 8760;
const HOURS_PER_SEASON = HOURS_PER_YEAR / 4;
const DEFAULT_SOLAR_ORIENTATION = 'south';
const SOLAR_SHADING_FACTOR = 1.0;

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
    defaultWindParameters: {
        powerCoefficient: 0.45,
        airDensityKgPerM3: 1.225,
        cutInSpeedMs: 3,
        cutOutSpeedMs: 25,
    },
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

const getSpecificationValue = (
    variant: AssetEstimationRequestDto['variant'],
    matches: (name: string) => boolean
): string | null => {
    if (!variant) return null;

    const spec = variant.specification.find((item) => matches(item.name.toLowerCase()));
    return spec?.value ?? null;
};

const getSpecificationNumber = (
    variant: AssetEstimationRequestDto['variant'],
    matches: (name: string) => boolean
): number | null => {
    const value = getSpecificationValue(variant, matches);
    return parseFirstNumber(value);
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

    const capacityLikeSpecs = variant.specification.filter((spec) => {
        const key = spec.name.toLowerCase();
        return key.includes('capacity') || key.includes('rated power') || key.includes('wattage');
    });

    const parsedCandidatesMW = capacityLikeSpecs
        .map((spec) => parsePowerToMW(spec.value))
        .filter((value): value is number => value !== null);

    // Prefer the largest parsed value so system-level capacity (for example kW/MW) wins over module wattage (W/Wp).
    const parsedMW = parsedCandidatesMW.length > 0 ? Math.max(...parsedCandidatesMW) : null;

    if (parsedMW !== null && parsedMW > 0) {
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

const normalizeOrientation = (orientation: string | undefined): string => {
    if (!orientation) return DEFAULT_SOLAR_ORIENTATION;

    return orientation
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-/g, '_');
};

const getSolarKkValue = (kkDictionary: Record<string, number>, orientation: string | undefined): number | null => {
    const normalizedOrientation = normalizeOrientation(orientation);
    const kkValue = kkDictionary[normalizedOrientation];
    if (!Number.isFinite(kkValue) || kkValue <= 0) return null;
    return kkValue;
};

type SeasonalWindspeed = {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
};

const getSeasonalWindspeed = (properties: Record<string, unknown> | undefined): SeasonalWindspeed | null => {
    if (!properties) return null;

    const spring = Number(properties.ws_spring1);
    const summer = Number(properties.ws_summer1);
    const autumn = Number(properties.ws_autumn1);
    const winter = Number(properties.ws_winter1);

    const values = [spring, summer, autumn, winter];
    if (!values.every((value) => Number.isFinite(value) && value > 0)) {
        return null;
    }

    return { spring, summer, autumn, winter };
};

const getWindSeasonalEnergyMWh = (
    seasonalWindspeed: SeasonalWindspeed,
    ratedPowerMW: number,
    rotorDiameterM: number,
    powerCoefficient: number,
    airDensityKgPerM3: number,
    cutInSpeedMs: number,
    cutOutSpeedMs: number
): number => {
    const radiusM = rotorDiameterM / 2;
    const sweptAreaM2 = Math.PI * radiusM ** 2;

    const seasonalSpeeds = [seasonalWindspeed.spring, seasonalWindspeed.summer, seasonalWindspeed.autumn, seasonalWindspeed.winter];

    const seasonalPowerMW = seasonalSpeeds.map((windSpeedMs) => {
        if (windSpeedMs < cutInSpeedMs || windSpeedMs > cutOutSpeedMs) {
            return 0;
        }

        const powerW = 0.5 * airDensityKgPerM3 * sweptAreaM2 * windSpeedMs ** 3 * powerCoefficient;
        const powerMW = powerW / 1_000_000;
        return clamp(powerMW, 0, ratedPowerMW);
    });

    return seasonalPowerMW.reduce((sum, powerMW) => sum + powerMW * HOURS_PER_SEASON, 0);
};

const getWindParameters = (variant: AssetEstimationRequestDto['variant']) => {
    const rotorDiameterM = getSpecificationNumber(variant, (name) => name.includes('rotor') && name.includes('diameter'));
    const powerCoefficient = getSpecificationNumber(variant, (name) => name.includes('power coefficient') || name.includes('(cp)'));
    const airDensityKgPerM3 = getSpecificationNumber(variant, (name) => name.includes('air density'));
    const cutInSpeedMs = getSpecificationNumber(variant, (name) => name.includes('cut-in'));
    const cutOutSpeedMs = getSpecificationNumber(variant, (name) => name.includes('cut-out'));

    return {
        rotorDiameterM,
        powerCoefficient: powerCoefficient ?? ENERGY_ASSUMPTIONS.defaultWindParameters.powerCoefficient,
        airDensityKgPerM3: airDensityKgPerM3 ?? ENERGY_ASSUMPTIONS.defaultWindParameters.airDensityKgPerM3,
        cutInSpeedMs: cutInSpeedMs ?? ENERGY_ASSUMPTIONS.defaultWindParameters.cutInSpeedMs,
        cutOutSpeedMs: cutOutSpeedMs ?? ENERGY_ASSUMPTIONS.defaultWindParameters.cutOutSpeedMs,
    };
};

export class EnergyEstimationService {
    constructor(private readonly dataProviderUtils: DataProviderUtils) {}

    private getSeasonalWindspeedAtLocation(longitude: number, latitude: number): SeasonalWindspeed | null {
        const windspeedLayer = this.dataProviderUtils.getWindspeedLayerData();
        const targetPoint = turf.point([longitude, latitude]);

        for (const feature of windspeedLayer.features) {
            for (const coordinates of feature.geometry.coordinates) {
                const polygon = turf.polygon(coordinates);
                if (turf.booleanPointInPolygon(targetPoint, polygon)) {
                    return getSeasonalWindspeed(feature.properties as Record<string, unknown> | undefined);
                }
            }
        }

        return null;
    }

    public estimateAssetContribution(req: AssetEstimationRequestDto): AssetEstimationResponseDto {
        const { variant, selectedSubstation, latitude, longitude, solarOrientation } = req;

        const technology = getTechnologyFromVariant(variant);
        const installedCapacityMW = getInstalledCapacityMW(variant);
        const connectionDistanceKm = parseDistanceKm(selectedSubstation.distanceFromTurbine);

        let grossAnnualMWh: number;

        if (technology === 'wind') {
            const seasonalWindspeed = this.getSeasonalWindspeedAtLocation(longitude, latitude);
            const windParameters = getWindParameters(variant);

            if (seasonalWindspeed && windParameters.rotorDiameterM && windParameters.rotorDiameterM > 0) {
                grossAnnualMWh = getWindSeasonalEnergyMWh(
                    seasonalWindspeed,
                    installedCapacityMW,
                    windParameters.rotorDiameterM,
                    windParameters.powerCoefficient,
                    windParameters.airDensityKgPerM3,
                    windParameters.cutInSpeedMs,
                    windParameters.cutOutSpeedMs
                );
            } else {
                const fallbackCapacityFactor = getResourceAdjustedCapacityFactor(technology, latitude);
                grossAnnualMWh = installedCapacityMW * HOURS_PER_YEAR * fallbackCapacityFactor;
            }
        } else {
            if (technology === 'solar') {
                const kkDictionary = this.dataProviderUtils.getSolarKkData().cardinal;
                const kkValue = getSolarKkValue(kkDictionary, solarOrientation);

                if (kkValue !== null) {
                    const installedCapacityKwp = installedCapacityMW * 1000;
                    const annualEnergyKwh = installedCapacityKwp * kkValue * SOLAR_SHADING_FACTOR;
                    grossAnnualMWh = annualEnergyKwh / 1000;
                } else {
                    const fallbackCapacityFactor = getResourceAdjustedCapacityFactor(technology, latitude);
                    grossAnnualMWh = installedCapacityMW * HOURS_PER_YEAR * fallbackCapacityFactor;
                }
            } else {
                const capacityFactor = getResourceAdjustedCapacityFactor(technology, latitude);
                grossAnnualMWh = installedCapacityMW * HOURS_PER_YEAR * capacityFactor;
            }
        }

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
            outputMWh: roundTo(deliveredMWh, 3),
            outputMW: roundTo(outputMW, 4),
            gridSupportMW: roundTo(gridSupportMW, 4),
            boostPercent: roundTo(boostPercent, 1),
            localBoostPercent: roundTo(localBoostPercent, 1),
            maxOutputMWh: Math.max(roundTo(deliveredMWh * 1.35, 3), 1),
            maxOutputMW: Math.max(roundTo(outputMW * 1.4, 4), 0.01),
            maxGridSupportMW: Math.max(roundTo(gridSupportMW * 1.4, 4), 0.01),
            maxBoostPercent: 100,
            maxLocalBoostPercent: 100,
        };
    }
}
