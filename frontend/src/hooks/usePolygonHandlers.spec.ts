// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import { act, renderHook } from '@testing-library/react';
import type { FeatureCollection, Polygon } from 'geojson';
import type { MapRef } from 'react-map-gl/maplibre';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MapVisualHelper } from '../utils/MapVisualHelper';
import { usePolygonHandlers } from './usePolygonHandlers';

vi.mock('maplibre-gl', () => ({
    default: {
        Popup: vi.fn().mockImplementation(() => ({
            setLngLat: vi.fn().mockReturnThis(),
            setDOMContent: vi.fn().mockReturnThis(),
            addTo: vi.fn().mockReturnThis(),
        })),
    },
    Popup: vi.fn().mockImplementation(() => ({
        setLngLat: vi.fn().mockReturnThis(),
        setDOMContent: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
    })),
}));

vi.mock('../stores/useMapStore', () => {
    const mockSetPolygonConfirmPopup = vi.fn();
    const mockSetPolygonStatus = vi.fn();
    const mockSetCachedHeatmap = vi.fn();
    const mockClearMarkerValues = vi.fn();
    const mockSetLayersPanelOpen = vi.fn();

    const mockStore = {
        polygonStatus: 'none',
        setPolygonConfirmPopup: mockSetPolygonConfirmPopup,
        setPolygonStatus: mockSetPolygonStatus,
        setCachedHeatmap: mockSetCachedHeatmap,
        clearMarkerValues: mockClearMarkerValues,
        setLayersPanelOpen: mockSetLayersPanelOpen,
    };

    const mockGetState = () => ({
        polygonConfirmPopup: null,
        setCachedHeatmap: mockSetCachedHeatmap,
    });

    const mockUseMapStore = (selector: any) => selector(mockStore);
    mockUseMapStore.getState = mockGetState;

    return {
        useMapStore: mockUseMapStore,
        mockSetLayersPanelOpen,
    };
});

vi.mock('react-dom/client', () => ({
    createRoot: () => ({
        render: vi.fn(),
    }),
}));

vi.mock('../utils/MapVisualHelper', () => ({
    MapVisualHelper: {
        extractFirstPolygon: vi.fn(),
        applyDimmedMaskAndPanToPolygon: vi.fn(),
        getConfirmationPopupCoordinates: vi.fn().mockReturnValue([0, 0]),
        removeDimmedMask: vi.fn(),
        removeExistingPopup: vi.fn(),
        removeHeatmapLayer: vi.fn(),
        getFeatureCollection: vi.fn().mockReturnValue({ type: 'FeatureCollection', features: [] }),
        getFirstPolygon: vi.fn(),
        remove3DAssets: vi.fn(),
    },
}));

vi.mock('../utils/MapEditGuards', () => ({
    preventPolygonEdit: vi.fn(),
}));

const fakePolygon: Polygon = {
    type: 'Polygon',
    coordinates: [
        [
            [0, 0],
            [1, 1],
            [2, 2],
            [0, 0],
        ],
    ],
};

const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: fakePolygon,
            properties: {},
        },
    ],
};

const createMockMapRef = (): React.RefObject<MapRef> => {
    const mockMap = {
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        getCanvas: vi.fn(() => ({ style: { cursor: '' } })),
        getContainer: vi.fn(() => ({ style: {} })),
    };

    return {
        current: {
            getMap: () => mockMap,
            on: mockMap.on,
            once: mockMap.once,
            off: mockMap.off,
            getCanvas: mockMap.getCanvas,
            getContainer: mockMap.getContainer,
        },
    } as unknown as React.RefObject<MapRef>;
};

const createMockDrawRef = (): React.RefObject<MapboxDraw> =>
    ({
        current: {
            getMode: vi.fn().mockReturnValue('simple_select'),
            getAll: vi.fn().mockReturnValue(geojson),
            changeMode: vi.fn(),
            deleteAll: vi.fn(),
        },
    }) as unknown as React.RefObject<MapboxDraw>;

describe('usePolygonHandlers', () => {
    let mapRef: React.RefObject<MapRef>;
    let drawRef: React.RefObject<MapboxDraw>;

    beforeEach(() => {
        vi.clearAllMocks();
        mapRef = createMockMapRef();
        drawRef = createMockDrawRef();
    });

    it('does not show popup if polygon not found', () => {
        (MapVisualHelper.extractFirstPolygon as any).mockReturnValue(null);

        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));
        act(() => {
            result.current.handlePolygonDrawn(geojson);
        });

        expect(MapVisualHelper.getConfirmationPopupCoordinates).not.toHaveBeenCalled();
    });

    it('does not start drawing mode if already in draw mode', () => {
        drawRef.current.getMode = vi.fn().mockReturnValue('draw_polygon');
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.startPolygonDraw();
        });

        expect(drawRef.current.changeMode).not.toHaveBeenCalled();
    });

    it('confirms polygon and applies mask', () => {
        (MapVisualHelper.extractFirstPolygon as any).mockReturnValue(fakePolygon);
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.handlePolygonConfirmed(geojson);
        });

        expect(MapVisualHelper.applyDimmedMaskAndPanToPolygon).toHaveBeenCalled();
    });

    it('edits polygon and removes 3D assets', () => {
        (MapVisualHelper.extractFirstPolygon as any).mockReturnValue(fakePolygon);
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.handlePolygonEdited(geojson);
        });

        expect(MapVisualHelper.applyDimmedMaskAndPanToPolygon).toHaveBeenCalled();
        expect(MapVisualHelper.remove3DAssets).toHaveBeenCalled();
    });

    it('shows confirmation popup when polygon is drawn', () => {
        (MapVisualHelper.extractFirstPolygon as any).mockReturnValue(fakePolygon);
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.handlePolygonDrawn(geojson);
        });

        expect(MapVisualHelper.removeExistingPopup).toHaveBeenCalled();
        expect(MapVisualHelper.getConfirmationPopupCoordinates).toHaveBeenCalled();
    });

    it('starts polygon draw successfully', () => {
        (MapVisualHelper.getFirstPolygon as any).mockReturnValue(null);
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.startPolygonDraw();
        });

        expect(drawRef.current.changeMode).toHaveBeenCalledWith('draw_polygon');
        expect(mapRef.current.getMap().on).toHaveBeenCalledWith('draw.modechange', expect.any(Function));
    });

    it('does not start drawing if polygon already exists', () => {
        (MapVisualHelper.getFirstPolygon as any).mockReturnValue(fakePolygon);
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.startPolygonDraw();
        });

        expect(drawRef.current.changeMode).not.toHaveBeenCalled();
    });

    it('handles mode change when polygon is drawn', () => {
        (MapVisualHelper.getFirstPolygon as any).mockReturnValueOnce(null).mockReturnValueOnce(fakePolygon);

        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.startPolygonDraw();
        });

        const modeChangeCalls = (mapRef.current.getMap().on as any).mock.calls;
        const modeChangeCall = modeChangeCalls.find((call: any) => call[0] === 'draw.modechange');
        if (modeChangeCall && modeChangeCall[1]) {
            act(() => {
                modeChangeCall[1]();
            });
        }

        expect(drawRef.current.changeMode).toHaveBeenCalledWith('simple_select', { featureIds: [] });
    });

    it('starts polygon edit successfully', () => {
        (MapVisualHelper.getFirstPolygon as any).mockReturnValue(fakePolygon);
        (MapVisualHelper.getFeatureCollection as any).mockReturnValue({
            features: [{ id: 'test-id' }],
        });
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.startPolygonEdit();
        });

        expect(MapVisualHelper.removeDimmedMask).toHaveBeenCalled();
        expect(MapVisualHelper.removeExistingPopup).toHaveBeenCalled();
        expect(MapVisualHelper.removeHeatmapLayer).toHaveBeenCalled();
        expect(drawRef.current.changeMode).toHaveBeenCalledWith('direct_select', { featureId: 'test-id' });
    });

    it('does not start edit if no polygon exists', () => {
        (MapVisualHelper.getFirstPolygon as any).mockReturnValue(null);
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.startPolygonEdit();
        });

        expect(drawRef.current.changeMode).not.toHaveBeenCalledWith('direct_select', expect.anything());
    });

    it('does not start edit if no polygon feature ID exists', () => {
        (MapVisualHelper.getFirstPolygon as any).mockReturnValue(fakePolygon);
        (MapVisualHelper.getFeatureCollection as any).mockReturnValue({
            features: [],
        });
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.startPolygonEdit();
        });

        expect(drawRef.current.changeMode).not.toHaveBeenCalledWith('direct_select', expect.anything());
    });

    it('handles user finish dragging during edit', () => {
        (MapVisualHelper.getFirstPolygon as any).mockReturnValue(fakePolygon);
        (MapVisualHelper.getFeatureCollection as any).mockReturnValue({
            features: [{ id: 'test-id' }],
        });
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.startPolygonEdit();
        });

        const mouseupCalls = (mapRef.current.getMap().once as any).mock.calls;
        const mouseupCall = mouseupCalls.find((call: any) => call[0] === 'mouseup');
        if (mouseupCall && mouseupCall[1]) {
            act(() => {
                mouseupCall[1]();
            });
        }

        expect(MapVisualHelper.removeExistingPopup).toHaveBeenCalled();
    });

    it('handles polygon deletion successfully', () => {
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.handlePolygonDeleted();
        });

        expect(drawRef.current.deleteAll).toHaveBeenCalled();
        expect(drawRef.current.changeMode).toHaveBeenCalledWith('simple_select', { featureIds: [] });
        expect(MapVisualHelper.removeDimmedMask).toHaveBeenCalled();
        expect(MapVisualHelper.removeExistingPopup).toHaveBeenCalled();
        expect(MapVisualHelper.removeHeatmapLayer).toHaveBeenCalled();
        expect(MapVisualHelper.remove3DAssets).toHaveBeenCalled();
    });

    it('handles polygon deletion when draw ref is null', () => {
        (drawRef as any).current = null;
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.handlePolygonDeleted();
        });

        expect(MapVisualHelper.removeDimmedMask).toHaveBeenCalled();
        expect(MapVisualHelper.removeExistingPopup).toHaveBeenCalled();
    });

    it('handles polygon deletion when map ref is null', () => {
        (mapRef as any).current = null;
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.handlePolygonDeleted();
        });

        expect(drawRef.current.deleteAll).toHaveBeenCalled();
        expect(drawRef.current.changeMode).toHaveBeenCalledWith('simple_select', { featureIds: [] });
    });

    it('handles polygon confirmed when no polygon exists', () => {
        (MapVisualHelper.extractFirstPolygon as any).mockReturnValue(null);
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.handlePolygonConfirmed(geojson);
        });

        expect(MapVisualHelper.applyDimmedMaskAndPanToPolygon).not.toHaveBeenCalled();
    });

    it('handles polygon edited when no polygon exists', () => {
        (MapVisualHelper.extractFirstPolygon as any).mockReturnValue(null);
        const { result } = renderHook(() => usePolygonHandlers({ mapRef, drawRef }));

        act(() => {
            result.current.handlePolygonEdited(geojson);
        });

        expect(MapVisualHelper.applyDimmedMaskAndPanToPolygon).not.toHaveBeenCalled();
        expect(MapVisualHelper.remove3DAssets).toHaveBeenCalled();
    });
});
