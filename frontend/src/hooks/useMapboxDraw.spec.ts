// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { renderHook } from '@testing-library/react';
import type { MapRef } from 'react-map-gl/maplibre';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useMapboxDraw from './useMapboxDraw';

vi.mock('@mapbox/mapbox-gl-draw');

describe('useMapboxDraw', () => {
    const mockAddControl = vi.fn();
    const mockRemoveControl = vi.fn();
    const mockGetMap = vi.fn().mockReturnValue({
        addControl: mockAddControl,
        removeControl: mockRemoveControl,
    });

    const mockMapRef = {
        current: {
            getMap: mockGetMap,
        },
    } as unknown as React.RefObject<MapRef>;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not initialise if mapRef.current is null', () => {
        const nullMapRef = { current: null } as unknown as React.RefObject<MapRef>;
        const { result } = renderHook(() => useMapboxDraw(nullMapRef, true));
        expect(result.current.current).toBeNull();
        expect(MapboxDraw).not.toHaveBeenCalled();
    });

    it('should not initialise if isReady is false', () => {
        const { result } = renderHook(() => useMapboxDraw(mockMapRef, false));
        expect(result.current.current).toBeNull();
        expect(MapboxDraw).not.toHaveBeenCalled();
    });

    it('should initialise draw control when map is ready', () => {
        const { result } = renderHook(() => useMapboxDraw(mockMapRef, true));
        expect(MapboxDraw).toHaveBeenCalledWith(
            expect.objectContaining({
                displayControlsDefault: false,
                styles: expect.any(Array),
            })
        );
        expect(mockAddControl).toHaveBeenCalled();
        expect(result.current.current).toBeInstanceOf(MapboxDraw);
    });

    it('should not re-initialise if drawRef already exists', () => {
        const { rerender } = renderHook(({ isReady }) => useMapboxDraw(mockMapRef, isReady), { initialProps: { isReady: true } });
        expect(MapboxDraw).toHaveBeenCalledTimes(1);
        rerender({ isReady: true });
        expect(MapboxDraw).toHaveBeenCalledTimes(1); // Still 1 — doesn't re-init
    });
});
