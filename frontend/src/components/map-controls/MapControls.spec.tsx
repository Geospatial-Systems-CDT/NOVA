// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen } from '@testing-library/react';
import type { MapRef } from 'react-map-gl/maplibre';
import { describe, expect, it, vi } from 'vitest';
import type { MapStyle } from '../../types/map';
import MapControls from './MapControls';

vi.mock('./compass/CompassButton', () => ({
    default: () => <button aria-label="Reset View">Reset View</button>,
}));

vi.mock('./view-toggle/ViewToggleButton', () => ({
    default: () => <button aria-label="Switch to 2D">2D/3D</button>,
}));

vi.mock('./zoom-in/ZoomInButton', () => ({
    default: () => <button aria-label="Zoom In">+</button>,
}));

vi.mock('./zoom-out/ZoomOutButton', () => ({
    default: () => <button aria-label="Zoom Out">-</button>,
}));

vi.mock('./map-style/MapStylePanel', () => ({
    default: ({ onStyleChange }: { onStyleChange: (style: MapStyle) => void }) => (
        <div>
            <button aria-label="Change map style">Style</button>
            <button onClick={() => onStyleChange('hybrid')}>Satellite</button>
        </div>
    ),
}));

vi.mock('./map-legend/MapLegendPanel', () => ({
    default: () => <button aria-label="Show map legend">Legend</button>,
}));

describe('MapControls', () => {
    const mockMap = {
        easeTo: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        getBearing: () => 0,
        getPitch: () => 0,
    };

    const mockMapRef = {
        current: {
            getMap: () => mockMap,
        },
    } as unknown as React.RefObject<MapRef>;

    const defaultProps = {
        mapRef: mockMapRef,
        onStyleChange: vi.fn(),
        currentStyle: 'streets' as MapStyle,
    };

    it('renders all control groups', () => {
        render(
            <MapControls
                is3D={false}
                setIs3D={function (_is3d: boolean): void {
                    throw new Error('Function not implemented.');
                }}
                {...defaultProps}
            />
        );
        expect(screen.getByLabelText('View controls')).toBeInTheDocument();
        expect(screen.getByLabelText('Zoom controls')).toBeInTheDocument();
        expect(screen.getByLabelText('Map style controls')).toBeInTheDocument();
        expect(screen.getByLabelText('Map legend controls')).toBeInTheDocument();
    });

    it('renders all control buttons', () => {
        render(
            <MapControls
                is3D={false}
                setIs3D={function (_is3d: boolean): void {
                    throw new Error('Function not implemented.');
                }}
                {...defaultProps}
            />
        );
        expect(screen.getByLabelText('Reset View')).toBeInTheDocument();
        expect(screen.getByLabelText('Switch to 2D')).toBeInTheDocument();
        expect(screen.getByLabelText('Zoom In')).toBeInTheDocument();
        expect(screen.getByLabelText('Zoom Out')).toBeInTheDocument();
        expect(screen.getByLabelText('Change map style')).toBeInTheDocument();
        expect(screen.getByLabelText('Show map legend')).toBeInTheDocument();
    });

    it('handles style change', () => {
        render(
            <MapControls
                is3D={false}
                setIs3D={function (_is3d: boolean): void {
                    throw new Error('Function not implemented.');
                }}
                {...defaultProps}
            />
        );
        fireEvent.click(screen.getByLabelText('Change map style'));
        expect(screen.getByText('Satellite')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Satellite'));
        expect(defaultProps.onStyleChange).toHaveBeenCalledWith('hybrid' as MapStyle);
    });
});
