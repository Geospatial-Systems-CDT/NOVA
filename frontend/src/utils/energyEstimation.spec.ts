//
//

import { describe, expect, it } from 'vitest';
import type { Variation } from '../components/search/add-asset/AddAsset';
import type { Substation } from '../components/map-substations-list/SubstationsList';
import { estimateAssetStats, getInstalledCapacityMW, getTechnologyFromVariant } from './energyEstimation';

const windVariant: Variation = {
    name: 'Vestas',
    image: '/images/turbine-one.png',
    icon: '/images/turbine-icon.png',
    specification: [
        { name: 'Capacity (MW)', value: '3.5 MW' },
        { name: 'Rotor Diameter', value: '40 m' },
    ],
};

const solarFarmVariant: Variation = {
    name: 'Farm',
    image: '/images/solar-two.png',
    icon: '/images/solar-icon.png',
    specification: [
        { name: 'Wattage', value: '500 Wp' },
        { name: 'Voltage', value: '400 V' },
    ],
};

const substationNear: Substation = {
    id: 11,
    name: 'Near Substation',
    distanceFromTurbine: '2.0',
    coordinates: [-3.2, 56.4],
};

const substationFar: Substation = {
    id: 11,
    name: 'Far Substation',
    distanceFromTurbine: '42.0',
    coordinates: [-3.2, 56.4],
};

describe('energyEstimation', () => {
    it('detects technology from variant metadata', () => {
        expect(getTechnologyFromVariant(windVariant)).toBe('wind');
        expect(getTechnologyFromVariant(solarFarmVariant)).toBe('solar');
    });

    it('parses installed wind capacity from MW specs', () => {
        expect(getInstalledCapacityMW(windVariant)).toBe(3.5);
    });

    it('uses solar farm fallback capacity when only panel-level Wp is present', () => {
        expect(getInstalledCapacityMW(solarFarmVariant)).toBe(5);
    });

    it('uses pvout-based factor for solar when provided', () => {
        const withoutPvout = estimateAssetStats({
            variant: solarFarmVariant,
            selectedSubstation: substationNear,
            latitude: 56.4,
            longitude: -3.2,
        });

        const withLowerPvout = estimateAssetStats({
            variant: solarFarmVariant,
            selectedSubstation: substationNear,
            latitude: 56.4,
            longitude: -3.2,
            solarPotentialKwhPerKwp: 980,
        });

        const withHigherPvout = estimateAssetStats({
            variant: solarFarmVariant,
            selectedSubstation: substationNear,
            latitude: 56.4,
            longitude: -3.2,
            solarPotentialKwhPerKwp: 1400,
        });

        expect(withLowerPvout.outputMWh).toBeLessThan(withoutPvout.outputMWh);
        expect(withHigherPvout.outputMWh).toBeGreaterThan(withoutPvout.outputMWh);
    });

    it('returns deterministic stats for identical inputs', () => {
        const input = {
            variant: windVariant,
            selectedSubstation: substationNear,
            latitude: 56.4,
            longitude: -3.2,
        };

        const a = estimateAssetStats(input);
        const b = estimateAssetStats(input);

        expect(a).toEqual(b);
    });

    it('reduces delivered and grid support output for long connection distance', () => {
        const near = estimateAssetStats({
            variant: windVariant,
            selectedSubstation: substationNear,
            latitude: 56.4,
            longitude: -3.2,
        });

        const far = estimateAssetStats({
            variant: windVariant,
            selectedSubstation: substationFar,
            latitude: 56.4,
            longitude: -3.2,
        });

        expect(far.outputMWh).toBeLessThan(near.outputMWh);
        expect(far.gridSupportMW).toBeLessThan(near.gridSupportMW);
    });

    it('handles missing variant with stable fallback values', () => {
        const stats = estimateAssetStats({
            variant: null,
            selectedSubstation: substationNear,
            latitude: 56.4,
            longitude: -3.2,
        });

        expect(stats.technology).toBe('unknown');
        expect(stats.outputMWh).toBeGreaterThan(0);
        expect(Number.isFinite(stats.outputMW)).toBe(true);
        expect(Number.isFinite(stats.gridSupportMW)).toBe(true);
    });

    it('handles numeric distance payloads from API without crashing', () => {
        const numericDistanceSubstation = {
            ...substationNear,
            distanceFromTurbine: 3.25 as unknown as string,
        };

        const stats = estimateAssetStats({
            variant: windVariant,
            selectedSubstation: numericDistanceSubstation,
            latitude: 56.4,
            longitude: -3.2,
        });

        expect(stats.connectionDistanceKm).toBe(3.25);
        expect(stats.outputMWh).toBeGreaterThan(0);
    });
});
