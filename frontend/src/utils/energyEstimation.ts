//
//

import type { Variation } from '../components/search/add-asset/AddAsset';
import type { Substation } from '../components/map-substations-list/SubstationsList';

const HOURS_PER_YEAR = 8760;
const SOLAR_SHADING_FACTOR = 1.0;
const DEFAULT_SOLAR_ORIENTATION = 'south';

const SOLAR_KK_BY_ORIENTATION: Record<string, number> = {
    south: 1023,
    south_west: 962,
    south_east: 962,
    west: 857,
    east: 857,
    north_west: 857,
    north_east: 857,
    north: 857,
};

export const ENERGY_ASSUMPTIONS = {
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

export type AssetTechnology = 'wind' | 'solar' | 'unknown';

export interface EstimatedAssetStats {
    assetId: string;
    technology: AssetTechnology;
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

interface EstimationInput {
    variant: Variation | null;
    selectedSubstation: Substation;
    latitude: number;
    longitude: number;
    solarOrientation?: string;
    assetCount?: number;
}

const sanitizeAssetCount = (assetCount: number | undefined): number => {
    if (!Number.isFinite(assetCount)) return 1;
    return Math.max(1, Math.floor(assetCount as number));
};

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

export const getTechnologyFromVariant = (variant: Variation | null): AssetTechnology => {
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

export const getInstalledCapacityMW = (variant: Variation | null): number => {
    const technology = getTechnologyFromVariant(variant);
    if (!variant) return ENERGY_ASSUMPTIONS.defaultInstalledCapacityMW[technology];

    const capacityLikeSpecs = variant.specification.filter((spec) => {
        const key = spec.name.toLowerCase();
        return key.includes('capacity') || key.includes('rated power') || key.includes('wattage');
    });

    const parsedCandidatesMW = capacityLikeSpecs
        .map((spec) => parsePowerToMW(spec.value))
        .filter((value): value is number => value !== null);

    // Prefer system-level capacity over module wattage by taking the largest parsed candidate.
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

const getResourceAdjustedCapacityFactor = (technology: AssetTechnology, latitude: number): number => {
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

const getSolarKkValue = (orientation: string | undefined): number | null => {
    const normalizedOrientation = normalizeOrientation(orientation);
    const kk = SOLAR_KK_BY_ORIENTATION[normalizedOrientation];
    return Number.isFinite(kk) && kk > 0 ? kk : null;
};

export const estimateAssetStats = ({ variant, selectedSubstation, latitude, longitude, solarOrientation, assetCount }: EstimationInput): EstimatedAssetStats => {
    const technology = getTechnologyFromVariant(variant);
    const installedCapacityMW = getInstalledCapacityMW(variant);
    const assetMultiplier = sanitizeAssetCount(assetCount);
    const connectionDistanceKm = parseDistanceKm(selectedSubstation.distanceFromTurbine);

    let grossAnnualMWh: number;

    if (technology === 'solar') {
        const kkValue = getSolarKkValue(solarOrientation);
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

    grossAnnualMWh *= assetMultiplier;

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
};
