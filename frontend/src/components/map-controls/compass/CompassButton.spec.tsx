// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { act, fireEvent, render, screen } from '@testing-library/react';
import type { MapRef } from 'react-map-gl/maplibre';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CompassButton from './CompassButton';

describe('CompassButton', () => {
    const mockMap = {
        easeTo: vi.fn(),
        getBearing: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    };

    const mockMapRef = {
        current: {
            getMap: () => mockMap,
        },
    } as unknown as React.RefObject<MapRef>;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the button with correct aria label', () => {
        render(<CompassButton mapRef={mockMapRef} />);
        const button = screen.getByRole('button', { name: 'Reset View' });
        expect(button).toBeInTheDocument();
    });

    it('renders the compass icon', () => {
        render(<CompassButton mapRef={mockMapRef} />);
        const icon = screen.getByAltText('Reset view');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('src', '/icons/compass.svg');
    });

    it('calls easeTo with correct parameters when clicked', () => {
        render(<CompassButton mapRef={mockMapRef} />);
        const button = screen.getByRole('button', { name: 'Reset View' });
        fireEvent.click(button);

        expect(mockMap.easeTo).toHaveBeenCalledWith({
            bearing: 0,
            duration: 1000,
        });
    });

    it('sets up and cleans up move event listener', () => {
        const { unmount } = render(<CompassButton mapRef={mockMapRef} />);

        expect(mockMap.on).toHaveBeenCalledWith('move', expect.any(Function));

        unmount();
        expect(mockMap.off).toHaveBeenCalledWith('move', expect.any(Function));
    });

    it('updates compass rotation when bearing changes', async () => {
        mockMap.getBearing.mockReturnValue(45);
        render(<CompassButton mapRef={mockMapRef} />);

        const moveHandler = mockMap.on.mock.calls[0][1];
        await act(async () => {
            moveHandler();
        });

        const icon = screen.getByAltText('Reset view');
        expect(icon).toHaveStyle({ transform: 'rotate(-45deg)' });
    });

    it('handles initial bearing correctly', async () => {
        mockMap.getBearing.mockReturnValue(90);
        await act(async () => {
            render(<CompassButton mapRef={mockMapRef} />);
        });

        const icon = screen.getByAltText('Reset view');
        expect(icon).toHaveStyle({ transform: 'rotate(-90deg)' });
    });

    it('handles null map reference gracefully', async () => {
        const nullMapRef = { current: null } as unknown as React.RefObject<MapRef>;
        await act(async () => {
            render(<CompassButton mapRef={nullMapRef} />);
        });

        const icon = screen.getByAltText('Reset view');
        expect(icon).toHaveStyle({ transform: 'rotate(0deg)' });
    });

    it('handles null map in click handler gracefully', () => {
        const nullMapRef = {
            current: {
                getMap: () => null,
            },
        } as unknown as React.RefObject<MapRef>;

        render(<CompassButton mapRef={nullMapRef} />);
        const button = screen.getByRole('button', { name: 'Reset View' });
        fireEvent.click(button);

        expect(mockMap.easeTo).not.toHaveBeenCalled();
    });

    it('handles multiple bearing updates', async () => {
        mockMap.getBearing.mockReturnValueOnce(45).mockReturnValueOnce(90).mockReturnValueOnce(180);

        await act(async () => {
            render(<CompassButton mapRef={mockMapRef} />);
        });

        let icon = screen.getByAltText('Reset view');
        expect(icon).toHaveStyle({ transform: 'rotate(-45deg)' });

        const moveHandler = mockMap.on.mock.calls[0][1];
        await act(async () => {
            moveHandler();
        });
        icon = screen.getByAltText('Reset view');
        expect(icon).toHaveStyle({ transform: 'rotate(-90deg)' });

        await act(async () => {
            moveHandler();
        });
        icon = screen.getByAltText('Reset view');
        expect(icon).toHaveStyle({ transform: 'rotate(-180deg)' });
    });
});
