// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import * as mapStore from '../../stores/useMapStore';
import PlacingMarkerOverlay from './PlacingMarkerOverlay';

describe('PlacingMarkerOverlay', () => {
    const baseProps = {
        mousePos: { x: 100, y: 200 },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(mapStore, 'useMapStore').mockImplementation((selector) =>
            selector({
                markerVariant: { name: 'Vestas', icon: '/images/turbine-icon.png' },
                cachedAssets: [
                    {
                        id: 'windTurbine',
                        name: 'Wind Turbine',
                        variations: [
                            {
                                name: 'Vestas',
                                icon: '/images/turbine-icon.png',
                            },
                        ],
                    },
                ],
            } as unknown as mapStore.MapState)
        );
    });

    it('renders nothing if mousePos is null', () => {
        const { container } = render(<PlacingMarkerOverlay mousePos={null} isInsidePolygon={true} suitability="green" />);
        expect(container.firstChild).toBeNull();
    });

    it('shows a wind turbine icon with full opacity if inside polygon', () => {
        render(<PlacingMarkerOverlay {...baseProps} isInsidePolygon={true} suitability={null} />);
        const img = screen.getByAltText(/wind turbine pending/i);
        expect(img).toHaveStyle('opacity: 1');
    });

    it('shows a wind turbine icon with reduced opacity if outside polygon', () => {
        render(<PlacingMarkerOverlay {...baseProps} isInsidePolygon={false} suitability={null} />);
        const img = screen.getByAltText(/wind turbine pending/i);
        expect(img).toHaveStyle('opacity: 0.4');
    });

    it('displays red cross if outside polygon', () => {
        render(<PlacingMarkerOverlay {...baseProps} isInsidePolygon={false} suitability={null} />);
        expect(screen.getByText('×')).toBeInTheDocument();
    });

    it('does not display red cross if inside polygon', () => {
        render(<PlacingMarkerOverlay {...baseProps} isInsidePolygon={true} suitability={null} />);
        expect(screen.queryByText('×')).not.toBeInTheDocument();
    });

    it('displays suitability: Unsuitable (red)', () => {
        render(<PlacingMarkerOverlay {...baseProps} isInsidePolygon={true} suitability="red" />);
        expect(screen.getByText('Unsuitable')).toBeInTheDocument();
    });

    it('displays suitability: Caution (amber)', () => {
        render(<PlacingMarkerOverlay {...baseProps} isInsidePolygon={true} suitability="amber" />);
        expect(screen.getByText('Caution')).toBeInTheDocument();
    });

    it('displays suitability: Suitable (green)', () => {
        render(<PlacingMarkerOverlay {...baseProps} isInsidePolygon={true} suitability="green" />);
        expect(screen.getByText('Suitable')).toBeInTheDocument();
    });

    it('does not show suitability tooltip if not inside polygon', () => {
        render(<PlacingMarkerOverlay {...baseProps} isInsidePolygon={false} suitability="green" />);
        expect(screen.queryByText('Suitable')).not.toBeInTheDocument();
    });

    it('shows a solar pending symbol when a solar variant is selected', () => {
        (mapStore.useMapStore as unknown as { mockImplementation: (fn: (s: mapStore.MapState) => unknown) => void }).mockImplementation((selector) =>
            selector({
                markerVariant: { name: 'Roof', icon: '/images/solar-icon.png' },
                cachedAssets: [
                    {
                        id: 'solarPanel',
                        name: 'Solar Panel',
                        variations: [
                            {
                                name: 'Roof',
                                icon: '/images/solar-icon.png',
                            },
                        ],
                    },
                ],
            } as unknown as mapStore.MapState)
        );

        render(<PlacingMarkerOverlay {...baseProps} isInsidePolygon={true} suitability={null} />);
        const img = screen.getByAltText(/solar panel pending/i) as HTMLImageElement;
        expect(img).toHaveAttribute('src', '/images/solar-icon.png');
    });
});
