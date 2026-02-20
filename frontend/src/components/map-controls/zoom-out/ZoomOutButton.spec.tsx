// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen } from '@testing-library/react';
import type { MapRef } from 'react-map-gl/maplibre';
import { describe, expect, it, vi } from 'vitest';
import ZoomOutButton from './ZoomOutButton';

describe('ZoomOutButton', () => {
    const mockMap = {
        zoomOut: vi.fn(),
    };

    const mockMapRef = {
        current: {
            getMap: () => mockMap,
        },
    } as unknown as React.RefObject<MapRef>;

    it('renders with correct aria label', () => {
        render(<ZoomOutButton mapRef={mockMapRef} />);
        expect(screen.getByLabelText('Zoom Out')).toBeInTheDocument();
    });

    it('renders with correct icon', () => {
        render(<ZoomOutButton mapRef={mockMapRef} />);
        const icon = screen.getByAltText('Zoom out');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('src', '/icons/remove.svg');
    });

    it('calls zoomOut when clicked', () => {
        render(<ZoomOutButton mapRef={mockMapRef} />);
        fireEvent.click(screen.getByLabelText('Zoom Out'));
        expect(mockMap.zoomOut).toHaveBeenCalledWith({ duration: 300 });
    });
});
