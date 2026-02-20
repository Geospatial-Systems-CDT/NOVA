// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useMarkerPlacement } from './useMarkerPlacement';
import { MapVisualHelper } from '../utils/MapVisualHelper';
import { useMapStore } from '../stores/useMapStore';

vi.mock('../stores/useMapStore');
vi.mock('../utils/MapVisualHelper');

const mockSetPlacing = vi.fn();
const mockSetMarkerPosition = vi.fn();
const mockSetMarkerBearing = vi.fn();

const mockMap = {
    getCanvas: vi.fn(() => ({
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
    })),
    unproject: vi.fn(),
    getBearing: vi.fn(() => 15),
    queryRenderedFeatures: vi.fn(),
};

const mockMapRef = { getMap: () => mockMap };

describe('useMarkerPlacement', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        (useMapStore as unknown as Mock).mockImplementation((selector) =>
            selector({
                placing: true,
                setPlacing: mockSetPlacing,
                setMarkerPosition: mockSetMarkerPosition,
                setMarkerBearing: mockSetMarkerBearing,
                mapRef: mockMapRef,
                drawRef: { dummy: true },
            })
        );
    });

    it('returns default state initially', () => {
        const { result } = renderHook(() => useMarkerPlacement());
        expect(result.current.mousePos).toBe(null);
        expect(result.current.isInsidePolygon).toBe(true);
        expect(result.current.suitability).toBe(null);
    });

    it('updates position and suitability on mouse move inside polygon', () => {
        (MapVisualHelper.isPointInsideUserDrawnPolygon as Mock).mockReturnValue(true);
        mockMap.unproject.mockReturnValue({ lng: 1, lat: 2 });
        mockMap.queryRenderedFeatures.mockReturnValue([{ properties: { suitability: 'amber' } }]);

        renderHook(() => useMarkerPlacement());

        const event = new MouseEvent('mousemove', {
            clientX: 100,
            clientY: 200,
        });

        act(() => {
            window.dispatchEvent(event);
        });
    });

    it('sets suitability as red when red polygon present', () => {
        (MapVisualHelper.isPointInsideUserDrawnPolygon as Mock).mockReturnValue(true);
        mockMap.unproject.mockReturnValue({ lng: 1, lat: 2 });
        mockMap.queryRenderedFeatures.mockReturnValue([{ properties: { suitability: 'red' } }]);

        const { result } = renderHook(() => useMarkerPlacement());

        act(() => {
            window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
        });

        expect(result.current.suitability).toBe('red');
    });

    it('sets suitability as null when outside polygon', () => {
        (MapVisualHelper.isPointInsideUserDrawnPolygon as Mock).mockReturnValue(false);
        mockMap.unproject.mockReturnValue({ lng: 1, lat: 2 });

        const { result } = renderHook(() => useMarkerPlacement());

        act(() => {
            window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));
        });

        expect(result.current.isInsidePolygon).toBe(false);
        expect(result.current.suitability).toBe(null);
    });

    it('handles map click inside polygon', () => {
        (MapVisualHelper.isPointInsideUserDrawnPolygon as Mock).mockReturnValue(true);

        const { result } = renderHook(() => useMarkerPlacement());

        const mockClickEvent = {
            lngLat: { lng: 5, lat: 10 },
            preventDefault: vi.fn(),
            originalEvent: {
                stopPropagation: vi.fn(),
                preventDefault: vi.fn(),
            },
        } as any;
        act(() => {
            result.current.handleMapClick(mockClickEvent);
        });

        expect(mockSetMarkerPosition).toHaveBeenCalledWith({ longitude: 5, latitude: 10 });
        expect(mockSetPlacing).toHaveBeenCalledWith(false);
        expect(mockSetMarkerBearing).toHaveBeenCalledWith(15);
    });

    it('does not handle map click if outside polygon', () => {
        (MapVisualHelper.isPointInsideUserDrawnPolygon as Mock).mockReturnValue(false);
        mockMap.unproject.mockReturnValue({ lng: 1, lat: 2 });

        const { result } = renderHook(() => useMarkerPlacement());

        // Simulate moving the mouse to update internal state
        act(() => {
            window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));
        });

        const mockClickEvent = {
            lngLat: { lng: 5, lat: 10 },
            preventDefault: vi.fn(),
            originalEvent: {
                stopPropagation: vi.fn(),
                preventDefault: vi.fn(),
            },
        } as any;

        act(() => {
            result.current.handleMapClick(mockClickEvent);
        });

        expect(mockSetMarkerPosition).not.toHaveBeenCalled();
    });
});
