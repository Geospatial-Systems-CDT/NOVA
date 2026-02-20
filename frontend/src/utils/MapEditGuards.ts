// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type maplibregl from 'maplibre-gl';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';

/**
 * Stops any editing if the user clicked on an existing mapbox draw polygon.
 */
export function preventPolygonEdit(map: maplibregl.Map, draw: MapboxDraw | null, point: { x: number; y: number }) {
    if (!map || !draw) return;

    const mode = draw.getMode?.();
    if (mode?.startsWith('draw')) return;

    const features = map.queryRenderedFeatures([point.x, point.y]);
    const poly = features.find((f) => f.layer?.id?.startsWith('gl-draw-polygon-'));
    if (poly) {
        draw.changeMode('simple_select', { featureIds: [] });
        map.getCanvas().style.cursor = 'default';
    }
}
