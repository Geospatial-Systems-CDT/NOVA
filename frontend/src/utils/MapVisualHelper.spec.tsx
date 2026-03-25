// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapVisualHelper } from './MapVisualHelper';
import type { FeatureCollection, Polygon } from 'geojson';
import { Popup } from 'maplibre-gl';

vi.mock('../stores/useMapStore', () => ({
    useMapStore: {
        getState: () => ({
            setPolygonConfirmPopup: vi.fn(),
        }),
    },
}));

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
    GLTFLoader: class {
        loadAsync = vi.fn().mockResolvedValue({
            scene: { scale: { set: vi.fn() } },
        });
    },
}));

const createMockMap = () => {
    const listeners: Record<string, Function[]> = {};

    return {
        getSource: vi.fn(),
        addSource: vi.fn(),
        getLayer: vi.fn(),
        addLayer: vi.fn(),
        fitBounds: vi.fn(),
        getBearing: vi.fn(() => 0),
        removeLayer: vi.fn(),
        removeSource: vi.fn(),
        setLayoutProperty: vi.fn(),
        getStyle: vi.fn(() => ({
            layers: [{ id: 'background' }, { id: 'basemap' }, { id: 'heatmap-layer' }, { id: 'gl-custom-layer' }],
        })),
        on: vi.fn((event, cb) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(cb);
        }),
        off: vi.fn((event, cb) => {
            listeners[event] = (listeners[event] || []).filter((fn) => fn !== cb);
        }),
        fire: (event: string) => {
            (listeners[event] || []).forEach((fn) => fn());
        },
        project: vi.fn(() => ({ x: 100, y: 100 })),
        unproject: vi.fn(() => ({ lng: 3, lat: 6.005 })),
        getCanvas: () => ({ style: { cursor: '' } }),
        flyTo: vi.fn(),
        setCenter: vi.fn(),
        queryTerrainElevation: vi.fn(() => 0),
    };
};

describe('MapVisualHelper', () => {
    let map: any;

    beforeEach(() => {
        map = createMockMap();
    });

    it('applyDimmedMaskAndPanToPolygon adds mask and pans', () => {
        const polygon: Polygon = {
            type: 'Polygon',
            coordinates: [
                [
                    [1, 1],
                    [5, 1],
                    [5, 5],
                    [1, 5],
                    [1, 1],
                ],
            ],
        };
        map.getSource.mockReturnValue(undefined);
        map.getLayer.mockReturnValue(undefined);
        MapVisualHelper.applyDimmedMaskAndPanToPolygon(map, polygon);
        expect(map.addSource).toHaveBeenCalled();
        expect(map.addLayer).toHaveBeenCalled();
        expect(map.fitBounds).toHaveBeenCalled();
    });

    it('removeDimmedMask removes mask layer and source', () => {
        map.getLayer.mockReturnValue(true);
        map.getSource.mockReturnValue(true);
        MapVisualHelper.removeDimmedMask(map);
        expect(map.removeLayer).toHaveBeenCalledWith('mask-layer');
        expect(map.removeSource).toHaveBeenCalledWith('mask');
    });

    it('getConfirmationPopupCoordinates calculates offset location', () => {
        const polygon: Polygon = {
            type: 'Polygon',
            coordinates: [
                [
                    [1, 1],
                    [5, 1],
                    [3, 6],
                    [1, 1],
                ],
            ],
        };
        const result = MapVisualHelper.getConfirmationPopupCoordinates(polygon, map);
        expect(map.project).toHaveBeenCalled();
        expect(map.unproject).toHaveBeenCalled();
        expect(result).toEqual([3, 6.005]);
    });

    it('getFirstPolygon returns polygon', () => {
        const draw = { getAll: () => ({ features: [{ geometry: { type: 'Polygon', coordinates: [] } }] }) };
        expect(MapVisualHelper.getFirstPolygon(draw as any)?.type).toBe('Polygon');
    });

    it('getFirstPolygon returns null for non-polygon', () => {
        const draw = { getAll: () => ({ features: [{ geometry: { type: 'Point', coordinates: [0, 0] } }] }) };
        expect(MapVisualHelper.getFirstPolygon(draw as any)).toBeNull();
    });

    it('extractFirstPolygon returns polygon', () => {
        const geojson: FeatureCollection = {
            type: 'FeatureCollection',
            features: [{ geometry: { type: 'Polygon', coordinates: [] }, type: 'Feature', properties: null }],
        };
        expect(MapVisualHelper.extractFirstPolygon(geojson)).not.toBeNull();
    });

    it('extractFirstPolygon returns null for invalid type', () => {
        const geojson: FeatureCollection = {
            type: 'FeatureCollection',
            features: [{ geometry: { type: 'LineString', coordinates: [] }, type: 'Feature', properties: null }],
        };
        expect(MapVisualHelper.extractFirstPolygon(geojson)).toBeNull();
    });

    it('getFeatureCollection returns feature collection', () => {
        const mockCollection = { type: 'FeatureCollection', features: [] };
        const draw = { getAll: () => mockCollection };
        expect(MapVisualHelper.getFeatureCollection(draw as any)).toEqual(mockCollection);
    });

    it('hideNonBaseLayers hides correct layers', () => {
        map.getLayer.mockReturnValue(true);
        const result = MapVisualHelper.hideNonBaseLayers(map);
        expect(result).toContain('heatmap-layer');
        expect(map.setLayoutProperty).toHaveBeenCalled();
    });

    it('showLayers sets visibility for layers', () => {
        map.getLayer.mockReturnValue(true);
        MapVisualHelper.showLayers(map, ['layer-1', 'layer-2']);
        expect(map.setLayoutProperty).toHaveBeenCalledTimes(2);
    });

    it('addOrUpdateHeatmapLayer adds source and layer', () => {
        const mapRef = { current: { getMap: () => map } };
        map.getSource.mockReturnValue(undefined);
        MapVisualHelper.addOrUpdateHeatmapLayer(mapRef as any, {
            type: 'FeatureCollection',
            features: [],
        });
        expect(map.addSource).toHaveBeenCalled();
        expect(map.addLayer).toHaveBeenCalled();
    });

    it('removeHeatmapLayer removes source and layer', () => {
        const mapRef = { current: { getMap: () => map } };
        map.getSource.mockReturnValue(true);
        map.getLayer.mockReturnValue(true);
        MapVisualHelper.removeHeatmapLayer(mapRef as any);
        expect(map.removeLayer).toHaveBeenCalledWith('heatmap-layer');
        expect(map.removeSource).toHaveBeenCalledWith('heatmap-layer');
    });

    it('addOrUpdateReportLayer adds source and layer', () => {
        const mapRef = { current: { getMap: () => map } };
        map.getSource.mockReturnValue(undefined);
        MapVisualHelper.addOrUpdateReportLayer(mapRef as any, {
            type: 'FeatureCollection',
            features: [],
        });
        expect(map.addSource).toHaveBeenCalledWith('report-layer', expect.any(Object));
        expect(map.addLayer).toHaveBeenCalled();
    });

    it('removeReportLayer removes source and layer', () => {
        const mapRef = { current: { getMap: () => map } };
        map.getSource.mockReturnValue(true);
        map.getLayer.mockReturnValue(true);
        MapVisualHelper.removeReportLayer(mapRef as any);
        expect(map.removeLayer).toHaveBeenCalledWith('report-layer');
        expect(map.removeSource).toHaveBeenCalledWith('report-layer');
    });

    it('_parseIssueFromFeature returns issue as array when present', () => {
        const feature = { properties: { issue: 'Example issue' } };
        const result = (MapVisualHelper as any)._parseIssueFromFeature(feature);
        expect(result).toEqual(['Example issue']);
    });

    it('_parseIssueFromFeature returns empty array when issue is missing', () => {
        const feature = { properties: {} };
        const result = (MapVisualHelper as any)._parseIssueFromFeature(feature);
        expect(result).toEqual([]);
    });

    it('_parseIssueFromFeature returns empty array when properties is missing', () => {
        const feature = {};
        const result = (MapVisualHelper as any)._parseIssueFromFeature(feature);
        expect(result).toEqual([]);
    });

    it('_handleHeatmapLayerClick creates popup with issue text', () => {
        const addTo = vi.fn().mockReturnThis();
        const setHTML = vi.fn().mockReturnValue({ addTo });
        const setLngLat = vi.fn().mockReturnValue({ setHTML });

        vi.spyOn(Popup.prototype, 'setLngLat').mockImplementation(setLngLat as any);
        vi.spyOn(Popup.prototype, 'setHTML').mockImplementation(setHTML as any);
        vi.spyOn(Popup.prototype, 'addTo').mockImplementation(addTo as any);

        const event = {
            lngLat: { lng: 0, lat: 0 },
            features: [
                {
                    properties: { issue: 'Test issue' },
                    // Include layer.id to simulate heatmap feature
                    layer: { id: 'heatmap-layer' },
                },
            ],
            target: map,
            defaultPrevented: false,
            originalEvent: { target: { tagName: 'DIV' } },
        };

        (MapVisualHelper as any)._handleHeatmapLayerClick(event);
        expect(setLngLat).toHaveBeenCalled();
        expect(setHTML).toHaveBeenCalledWith(expect.stringContaining('Test issue'));
        expect(addTo).toHaveBeenCalledWith(map);
    });

    it('_getHighestPriorityIssues keeps only the highest severity issue per topic', () => {
        const features = [
            {
                properties: {
                    issue: 'Close to special areas of conservation - <= 1.5km',
                    suitability: 'amber',
                },
            },
            {
                properties: {
                    issue: 'Too close to special areas of conservation - <= 1km',
                    suitability: 'red',
                },
            },
            {
                properties: {
                    issue: 'Special area of conservation',
                    suitability: 'darkRed',
                },
            },
            {
                properties: {
                    issue: 'Too close to sites of special scientific interest - <= 1km',
                    suitability: 'red',
                },
            },
        ];

        const result = (MapVisualHelper as any)._getHighestPriorityIssues(features);

        expect(result).toContain('Special area of conservation');
        expect(result).toContain('Too close to sites of special scientific interest - <= 1km');
        expect(result).not.toContain('Too close to special areas of conservation - <= 1km');
        expect(result).not.toContain('Close to special areas of conservation - <= 1.5km');
    });

    it('_handleHeatmapLayerClick popup suppresses lower severity duplicates for the same topic', () => {
        const addTo = vi.fn().mockReturnThis();
        const setHTML = vi.fn().mockReturnValue({ addTo });
        const setLngLat = vi.fn().mockReturnValue({ setHTML });

        vi.spyOn(Popup.prototype, 'setLngLat').mockImplementation(setLngLat as any);
        vi.spyOn(Popup.prototype, 'setHTML').mockImplementation(setHTML as any);
        vi.spyOn(Popup.prototype, 'addTo').mockImplementation(addTo as any);

        const event = {
            lngLat: { lng: 0, lat: 0 },
            features: [
                {
                    properties: {
                        issue: 'Close to special areas of conservation - <= 1.5km',
                        suitability: 'amber',
                    },
                    layer: { id: 'heatmap-layer' },
                },
                {
                    properties: {
                        issue: 'Too close to special areas of conservation - <= 1km',
                        suitability: 'red',
                    },
                    layer: { id: 'heatmap-layer' },
                },
                {
                    properties: {
                        issue: 'Special area of conservation',
                        suitability: 'darkRed',
                    },
                    layer: { id: 'heatmap-layer' },
                },
            ],
            target: map,
            defaultPrevented: false,
            originalEvent: { target: { tagName: 'DIV' } },
        };

        (MapVisualHelper as any)._handleHeatmapLayerClick(event);

        const html = (setHTML as any).mock.calls[0][0];
        expect(html).toContain('Special area of conservation');
        expect(html).not.toContain('Too close to special areas of conservation - <= 1km');
        expect(html).not.toContain('Close to special areas of conservation - <= 1.5km');
    });

    it('visualiseAssetsIn3d logs and skips if marker is null', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        await MapVisualHelper.visualiseAssetsIn3d(map, null, null, null);
        expect(warn).toHaveBeenCalledWith('No marker position set. Skipping visualisation.');
        warn.mockRestore();
    });

    it('visualiseAssetsIn3d logs and skips if lat/lng is missing', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        await MapVisualHelper.visualiseAssetsIn3d(map, { latitude: 10 }, null, null);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('longitude or latitude'));
        warn.mockRestore();
    });
});
