// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { MapRef } from 'react-map-gl/maplibre';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ViewToggleButton from './ViewToggleButton';
import type { MapStyle } from '../../../types/map';
import { MapVisualHelper } from '../../../utils/MapVisualHelper';

describe('ViewToggleButton', () => {
    let mockMap: any;
    let mockMapRef: React.RefObject<MapRef>;

    beforeEach(() => {
        mockMap = {
            easeTo: vi.fn(),
            isMoving: () => false,
            once: (_event: string, cb: () => void) => cb(),
            getSource: () => null,
            addSource: vi.fn(),
            setTerrain: vi.fn(),
            getTerrain: vi.fn(),
            getLayer: vi.fn(() => null),
            removeLayer: vi.fn(),
        };

        mockMapRef = {
            current: {
                getMap: () => mockMap,
            },
        } as unknown as React.RefObject<MapRef>;

        // Stub helper methods to prevent side effects
        vi.spyOn(MapVisualHelper, 'removeHeatmapLayer').mockImplementation(() => {});
        vi.spyOn(MapVisualHelper, 'addOrUpdateHeatmapLayer').mockImplementation(() => {});
    });

    function setup(initial3D: boolean, initialStyle: MapStyle) {
        const onStyleChange = vi.fn();
        const setIs3D = vi.fn();
        render(<ViewToggleButton mapRef={mockMapRef} onStyleChange={onStyleChange} is3D={initial3D} setIs3D={setIs3D} currentStyle={initialStyle} />);
        const button = screen.getByRole('button');
        return { button, onStyleChange, setIs3D };
    }

    it('renders "3D" when is3D is false', () => {
        setup(false, 'basic');
        expect(screen.getByText('3D')).toBeInTheDocument();
        expect(screen.getByLabelText('Switch to 3D')).toBeInTheDocument();
    });

    it('renders "2D" when is3D is true', () => {
        setup(true, 'hybrid');
        expect(screen.getByText('2D')).toBeInTheDocument();
        expect(screen.getByLabelText('Switch to 2D')).toBeInTheDocument();
    });

    it('toggles back to 2D: calls onStyleChange(previousStyle), setIs3D(false), and easeTo({ pitch: 0, duration: 400 })', () => {
        const { button, onStyleChange, setIs3D } = setup(true, 'hybrid');
        fireEvent.click(button);
        expect(onStyleChange).toHaveBeenCalledWith('hybrid');
        expect(setIs3D).toHaveBeenCalledWith(false);
        expect(mockMap.easeTo).toHaveBeenCalledWith({
            pitch: 0,
            duration: 400,
        });
    });

    it('does nothing if map is moving', () => {
        mockMap.isMoving = () => true;
        const { button, onStyleChange, setIs3D } = setup(false, 'basic');
        fireEvent.click(button);
        expect(onStyleChange).not.toHaveBeenCalled();
        expect(setIs3D).not.toHaveBeenCalled();
    });

    it('does nothing if mapRef.current is null', () => {
        const nullMapRef = { current: null } as unknown as React.RefObject<MapRef>;
        const onStyleChange = vi.fn();
        const setIs3D = vi.fn();
        render(<ViewToggleButton mapRef={nullMapRef} onStyleChange={onStyleChange} is3D={false} setIs3D={setIs3D} currentStyle="basic" />);
        fireEvent.click(screen.getByRole('button'));
        expect(onStyleChange).not.toHaveBeenCalled();
    });
});
