// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen } from '@testing-library/react';
import type { MapRef } from 'react-map-gl/maplibre';
import { describe, expect, it, vi } from 'vitest';
import ZoomInButton from './ZoomInButton';

describe('ZoomInButton', () => {
    const mockMap = {
        zoomIn: vi.fn(),
    };

    const mockMapRef = {
        current: {
            getMap: () => mockMap,
        },
    } as unknown as React.RefObject<MapRef>;

    it('renders with correct aria label', () => {
        render(<ZoomInButton mapRef={mockMapRef} />);
        expect(screen.getByLabelText('Zoom In')).toBeInTheDocument();
    });

    it('renders with correct icon', () => {
        render(<ZoomInButton mapRef={mockMapRef} />);
        const icon = screen.getByAltText('Zoom in');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('src', '/icons/add.svg');
    });

    it('calls zoomIn when clicked', () => {
        render(<ZoomInButton mapRef={mockMapRef} />);
        fireEvent.click(screen.getByLabelText('Zoom In'));
        expect(mockMap.zoomIn).toHaveBeenCalledWith({ duration: 300 });
    });
});
