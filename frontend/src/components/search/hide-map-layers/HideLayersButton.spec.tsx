// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen } from '@testing-library/react';
import HideLayersButton from './HideLayersButton';
import { MapVisualHelper } from '../../../utils/MapVisualHelper';
import { vi, describe, it, beforeEach } from 'vitest';
import type { MapRef } from 'react-map-gl/maplibre';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

describe('HideLayersButton', () => {
    const getMockMap = () => ({
        getLayer: vi.fn(),
        getStyle: vi.fn(() => ({
            layers: [{ id: 'background' }, { id: 'basemap-road' }, { id: 'heatmap-layer' }, { id: 'custom-layer-1' }],
        })),
        setLayoutProperty: vi.fn(),
    });

    const mockMapRef = (): React.RefObject<MapRef> =>
        ({
            current: {
                getMap: () => getMockMap(),
            },
        }) as unknown as React.RefObject<MapRef>;

    const mockFeatureCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
        type: 'FeatureCollection',
        features: [],
    };

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('does not render button if cachedHeatmap is null', () => {
        render(<HideLayersButton mapRef={mockMapRef()} cachedHeatmap={null} />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders button if cachedHeatmap is set', () => {
        render(<HideLayersButton mapRef={mockMapRef()} cachedHeatmap={mockFeatureCollection} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('toggles layers visibility on click', async () => {
        const hideMock = vi.spyOn(MapVisualHelper, 'hideNonBaseLayers').mockReturnValue(['custom-layer-1']);
        const showMock = vi.spyOn(MapVisualHelper, 'showLayers').mockImplementation(() => {});

        render(<HideLayersButton mapRef={mockMapRef()} cachedHeatmap={mockFeatureCollection} />);

        const button = await screen.findByRole('button');

        fireEvent.click(button); // hides layers
        expect(hideMock).toHaveBeenCalled();

        fireEvent.click(button); // shows layers
        expect(showMock).toHaveBeenCalledWith(expect.anything(), ['custom-layer-1']);
    });
});
