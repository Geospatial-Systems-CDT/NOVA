// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { FeatureCollection, Geometry, Polygon } from 'geojson';
import maplibregl from 'maplibre-gl';
import { useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { MapRef } from 'react-map-gl/maplibre';
import ConfirmPolygonButton from '../components/map-controls/confirm-polygon/ConfirmPolygonButton';
import { useMapStore } from '../stores/useMapStore';
import { preventPolygonEdit } from '../utils/MapEditGuards';
import { MapVisualHelper } from '../utils/MapVisualHelper';

interface UsePolygonHandlersProps {
    mapRef: React.RefObject<MapRef>;
    drawRef: React.RefObject<MapboxDraw | null>;
}

function createConfirmationPopup(polygon: Polygon, onConfirm: () => void, map: maplibregl.Map) {
    const popupNode = document.createElement('div');
    createRoot(popupNode).render(<ConfirmPolygonButton onConfirm={onConfirm} />);
    return new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        .setLngLat(MapVisualHelper.getConfirmationPopupCoordinates(polygon, map))
        .setDOMContent(popupNode)
        .addTo(map);
}

export function usePolygonHandlers({ mapRef, drawRef }: UsePolygonHandlersProps) {
    const polygonStatus = useMapStore((s) => s.polygonStatus);
    const setPopupRef = useMapStore((s) => s.setPolygonConfirmPopup);
    const setPolygonStatus = useMapStore((s) => s.setPolygonStatus);
    const setCachedHeatmap = useMapStore((s) => s.setCachedHeatmap);
    const clearMarkerValues = useMapStore((s) => s.clearMarkerValues);
    const setLayersPanelOpen = useMapStore((s) => s.setLayersPanelOpen);

    const eventHandlersRef = useRef<{
        updatePopupPosition?: () => void;
        handleUserFinishDragging?: () => void;
        handleModeChange?: () => void;
    }>({});

    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const shouldPrevent = polygonStatus === 'pendingConfirmation' || polygonStatus === 'confirmed';
        if (!shouldPrevent) return;

        const handler = (e: maplibregl.MapMouseEvent) => {
            const draw = drawRef.current;
            preventPolygonEdit(map, draw, e.point);
        };

        map.on('click', handler);
        map.on('contextmenu', handler);

        return () => {
            map.off('click', handler);
            map.off('contextmenu', handler);
        };
    }, [mapRef, drawRef, polygonStatus]);

    const handlePolygonConfirmed = useCallback(
        (geojson: FeatureCollection<Geometry>) => {
            setPolygonStatus('confirmed');

            const polygon = MapVisualHelper.extractFirstPolygon(geojson);
            if (polygon) {
                MapVisualHelper.applyDimmedMaskAndPanToPolygon(mapRef.current!.getMap(), polygon);
            }
        },
        [mapRef, setPolygonStatus]
    );

    const showConfirmationPopup = useCallback(
        (polygon: Polygon, onConfirm: () => void) => {
            MapVisualHelper.removeExistingPopup(useMapStore.getState().polygonConfirmPopup);
            const popup = createConfirmationPopup(polygon, onConfirm, mapRef.current!.getMap());
            setPopupRef(popup);
        },
        [mapRef, setPopupRef]
    );

    const handlePolygonDrawn = useCallback(
        (geojson: FeatureCollection<Geometry>) => {
            setPolygonStatus('pendingConfirmation');

            const polygon = MapVisualHelper.extractFirstPolygon(geojson);
            if (!polygon) return;

            showConfirmationPopup(polygon, () => {
                MapVisualHelper.removeExistingPopup(useMapStore.getState().polygonConfirmPopup);
                handlePolygonConfirmed(geojson);
            });
        },
        [setPolygonStatus, showConfirmationPopup, handlePolygonConfirmed]
    );

    const startPolygonDraw = useCallback(() => {
        const map = mapRef.current;
        const draw = drawRef.current;
        if (!map || !draw) return;

        if (draw.getMode().startsWith('draw')) return;
        if (MapVisualHelper.getFirstPolygon(draw)) return;

        draw.changeMode('draw_polygon');
        map.getCanvas().style.cursor = 'crosshair';
        setPolygonStatus('drawing');

        const handleModeChange = () => {
            const polygon = MapVisualHelper.getFirstPolygon(draw);
            if (polygon) {
                draw.changeMode('simple_select', { featureIds: [] });
                map.off('draw.modechange', handleModeChange);

                const geojson = MapVisualHelper.getFeatureCollection(draw);
                handlePolygonDrawn(geojson);
                map.getCanvas().style.cursor = 'grab';
            }
        };

        eventHandlersRef.current.handleModeChange = handleModeChange;
        map.on('draw.modechange', handleModeChange);
    }, [mapRef, drawRef, handlePolygonDrawn, setPolygonStatus]);

    const handlePolygonEdited = useCallback(
        (geojson: FeatureCollection<Geometry>) => {
            setPolygonStatus('confirmed');
            setCachedHeatmap(null);

            const polygon = MapVisualHelper.extractFirstPolygon(geojson);
            if (polygon) {
                MapVisualHelper.applyDimmedMaskAndPanToPolygon(mapRef.current!.getMap(), polygon);
            }

            MapVisualHelper.remove3DAssets(mapRef.current.getMap());
        },
        [setPolygonStatus, setCachedHeatmap, mapRef]
    );

    const startPolygonEdit = useCallback(() => {
        const draw = drawRef.current;
        const map = mapRef.current?.getMap();
        if (!map || !draw) return;

        MapVisualHelper.removeDimmedMask(map);
        MapVisualHelper.removeExistingPopup(useMapStore.getState().polygonConfirmPopup);
        MapVisualHelper.removeHeatmapLayer(mapRef);
        useMapStore.getState().setCachedHeatmap(null);

        map.getCanvas().style.cursor = 'grab';

        const polygon = MapVisualHelper.getFirstPolygon(draw);
        const polygonFeatureId = MapVisualHelper.getFeatureCollection(draw).features[0]?.id;
        if (!polygon || !polygonFeatureId) return;

        draw.changeMode('direct_select', { featureId: polygonFeatureId });
        setPolygonStatus('editing');

        const handleUserFinishDragging = () => {
            const latestPolygon = MapVisualHelper.getFirstPolygon(draw);
            if (!latestPolygon) return;

            MapVisualHelper.removeExistingPopup(useMapStore.getState().polygonConfirmPopup);

            const popup = createConfirmationPopup(
                latestPolygon,
                () => {
                    draw.changeMode('simple_select', { featureIds: [] });
                    MapVisualHelper.removeExistingPopup(useMapStore.getState().polygonConfirmPopup);
                    setPolygonStatus('confirmed');
                    handlePolygonEdited(MapVisualHelper.getFeatureCollection(draw));
                },
                map
            );

            setPopupRef(popup);

            const updatePopupPosition = () => {
                const updatedPolygon = MapVisualHelper.getFirstPolygon(draw);
                if (updatedPolygon) {
                    popup.setLngLat(MapVisualHelper.getConfirmationPopupCoordinates(updatedPolygon, map));
                }
            };

            updatePopupPosition();
            map.on('draw.update', updatePopupPosition);
            map.on('draw.selectionchange', updatePopupPosition);

            eventHandlersRef.current.updatePopupPosition = updatePopupPosition;
            eventHandlersRef.current.handleUserFinishDragging = handleUserFinishDragging;

            map.off('mouseup', handleUserFinishDragging);
            map.off('touchend', handleUserFinishDragging);
        };

        map.once('mouseup', handleUserFinishDragging);
        map.once('touchend', handleUserFinishDragging);
    }, [drawRef, mapRef, handlePolygonEdited, setPolygonStatus, setPopupRef]);

    const handlePolygonDeleted = useCallback(() => {
        setPolygonStatus('none');
        clearMarkerValues();
        setCachedHeatmap(null);
        setLayersPanelOpen(true);

        const draw = drawRef.current;
        if (draw) {
            draw.deleteAll();
            draw.changeMode('simple_select', { featureIds: [] });
        }

        const map = mapRef.current?.getMap();
        if (map) {
            MapVisualHelper.removeDimmedMask(map);
            MapVisualHelper.removeExistingPopup(useMapStore.getState().polygonConfirmPopup);
            MapVisualHelper.removeHeatmapLayer(mapRef);
            MapVisualHelper.remove3DAssets(mapRef.current.getMap());

            if (eventHandlersRef.current.updatePopupPosition) {
                map.off('draw.update', eventHandlersRef.current.updatePopupPosition);
                map.off('draw.selectionchange', eventHandlersRef.current.updatePopupPosition);
            }
            if (eventHandlersRef.current.handleModeChange) {
                map.off('draw.modechange', eventHandlersRef.current.handleModeChange);
            }

            eventHandlersRef.current = {};

            map.getCanvas().style.cursor = '';
        }
    }, [mapRef, setPolygonStatus, clearMarkerValues, setCachedHeatmap, setLayersPanelOpen, drawRef]);

    return {
        handlePolygonDrawn,
        handlePolygonConfirmed,
        handlePolygonEdited,
        handlePolygonDeleted,
        startPolygonDraw,
        startPolygonEdit,
    };
}
