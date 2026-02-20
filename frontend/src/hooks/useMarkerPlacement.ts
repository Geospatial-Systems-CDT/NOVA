// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useEffect, useState } from 'react';
import { useMapStore } from '../stores/useMapStore';
import type { MapMouseEvent } from 'maplibre-gl';
import { MapVisualHelper } from '../utils/MapVisualHelper';

export function useMarkerPlacement() {
    const placing = useMapStore((s) => s.placing);
    const setPlacing = useMapStore((s) => s.setPlacing);
    const setMarkerPosition = useMapStore((s) => s.setMarkerPosition);
    const setMarkerBearing = useMapStore((s) => s.setMarkerBearing);
    const mapRef = useMapStore((s) => s.mapRef);
    const drawRef = useMapStore((s) => s.drawRef);

    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [isInsidePolygon, setIsInsidePolygon] = useState(true);
    const [suitability, setSuitability] = useState<'darkRed' | 'red' | 'amber' | 'green' | null>(null);

    useEffect(() => {
        if (!placing || !mapRef?.getMap) return;

        const map = mapRef.getMap();
        const rect = map.getCanvas().getBoundingClientRect();

        const handleMouseMove = (e: MouseEvent) => {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setMousePos({ x: e.clientX, y: e.clientY });

            const { lng, lat } = map.unproject([x, y]);
            const inside = drawRef ? MapVisualHelper.isPointInsideUserDrawnPolygon(drawRef, lng, lat) : true;
            setIsInsidePolygon(inside);

            if (inside) {
                const features = map.queryRenderedFeatures([x, y], { layers: ['heatmap-layer'] });
                const suitabilityValues = features.map((f) => f.properties?.suitability).filter(Boolean);

                if (suitabilityValues.includes('red')) {
                    setSuitability('red');
                } else if (suitabilityValues.includes('amber')) {
                    setSuitability('amber');
                } else if (suitabilityValues.includes('green')) {
                    setSuitability('green');
                } else {
                    setSuitability(null);
                }
            } else {
                setSuitability(null);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [placing, drawRef, mapRef]);

    const handleMapClick = (e: MapMouseEvent & { originalEvent: MouseEvent }) => {
        if (!placing || !isInsidePolygon) return;

        const { lng, lat } = e.lngLat;
        setMarkerPosition({ longitude: lng, latitude: lat });

        const map = mapRef?.getMap?.();
        if (map) {
            setMarkerBearing(map.getBearing());
        }

        setPlacing(false);
        e.originalEvent.stopPropagation?.();
        e.preventDefault();
    };

    return {
        mousePos,
        handleMapClick,
        isInsidePolygon,
        suitability,
    };
}
