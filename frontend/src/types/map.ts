// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export const MAPTILER_TOKEN = import.meta.env.VITE_MAPTILER_API_KEY;

const readNumberEnv = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

// Map startup view can be overridden from .env.local for temporary tuning.
export const INITIAL_MAP_LONGITUDE = readNumberEnv(import.meta.env.VITE_INITIAL_MAP_LONGITUDE, -1.611);
export const INITIAL_MAP_LATITUDE = readNumberEnv(import.meta.env.VITE_INITIAL_MAP_LATITUDE, 54.5);
export const INITIAL_MAP_ZOOM = readNumberEnv(import.meta.env.VITE_INITIAL_MAP_ZOOM, 5.6);

export type MapStyle = 'basic' | 'osm' | 'hybrid' | 'bright' | 'satellite';

export const MAP_STYLES: Record<MapStyle, string> = {
    basic: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_TOKEN}`,
    osm: `https://api.maptiler.com/maps/openstreetmap/style.json?key=${MAPTILER_TOKEN}`,
    hybrid: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_TOKEN}`,
    bright: `https://api.maptiler.com/maps/bright-v2/style.json?key=${MAPTILER_TOKEN}`,

    // This is required for 3d map rendering as only certain styles are compatible
    satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_TOKEN}`,
};

export const MAPTILER_TERRAIN_SOURCE_URL = `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${MAPTILER_TOKEN}`;
