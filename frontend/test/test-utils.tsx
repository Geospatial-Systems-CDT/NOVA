// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render as rtlRender } from '@testing-library/react';
import type { ReactElement } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { vi } from 'vitest';

export function render(ui: ReactElement, { ...renderOptions } = {}) {
    return rtlRender(ui, { ...renderOptions });
}

export function createMockMapRef(): React.RefObject<MapRef> {
    const mockMap = {
        flyTo: vi.fn(),
        addControl: vi.fn(),
        removeControl: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
        getSource: vi.fn(),
        addSource: vi.fn(),
        getLayer: vi.fn(),
        addLayer: vi.fn(),
        fitBounds: vi.fn(),
        removeLayer: vi.fn(),
        removeSource: vi.fn(),
        getContainer: vi.fn(() => document.createElement('div')),
        getMap: vi.fn().mockReturnValue('mock-map'),
        queryRenderedFeatures: vi.fn(),
        transform: {
            projection: {
                getCoveringTilesDetailsProvider: vi.fn().mockReturnValue(() => ({
                    coveringTiles: [],
                    zoom: 0,
                })),
            },
        },
    };

    return {
        current: {
            getMap: vi.fn().mockReturnValue(mockMap),
        },
    } as unknown as React.RefObject<MapRef>;
}
