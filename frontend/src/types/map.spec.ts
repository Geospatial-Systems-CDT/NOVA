// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

// src/types/map.spec.ts
import { MAP_STYLES } from './map';
import type { MapStyle } from './map';

describe('map types', () => {
    it('defines all required map styles', () => {
        const expectedStyles: MapStyle[] = ['basic', 'osm', 'hybrid', 'bright', 'satellite'];
        expect(Object.keys(MAP_STYLES)).toEqual(expectedStyles);
    });

    it('provides valid MapTiler style URLs', () => {
        for (const url of Object.values(MAP_STYLES)) {
            expect(url).toMatch(/^https:\/\/api\.maptiler\.com\/maps\//);
            expect(url).toContain(`?key=${process.env.VITE_MAPTILER_API_KEY}`);
        }
    });

    it('has unique style URLs for each map style', () => {
        const urls = Object.values(MAP_STYLES);
        const uniqueCount = new Set(urls).size;
        expect(uniqueCount).toBe(urls.length);
    });

    it('has valid version numbers for versioned styles', () => {
        // e.g. basic-v2, bright-v2 etc.
        const versioned = ['basic', 'bright'] as const;
        for (const style of versioned) {
            const url = MAP_STYLES[style];
            // ensure there's a "-v<number>" in the path
            expect(url).toMatch(/-[vV]\d+/);
        }
    });
});
