// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import MapLegendPanel from './MapLegendPanel';
import { useState } from 'react';

const createMockMap = () => {
    const listeners: Record<string, Function[]> = {};

    const map = {
        getLayer: vi.fn((id) => id === 'heatmap-layer'),
        on: vi.fn((event, callback) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(callback);
        }),
        off: vi.fn((event, callback) => {
            listeners[event] = (listeners[event] || []).filter((fn) => fn !== callback);
        }),
        fire: (event: string) => {
            (listeners[event] || []).forEach((fn) => fn());
        },
    };

    return { map, listeners };
};

describe('MapLegendPanel', () => {
    let map: any;
    let mapRef: any;

    beforeEach(() => {
        const mock = createMockMap();
        map = mock.map;
        mapRef = { current: { getMap: () => map } };
    });

    const MapLegendPanelWrapper = () => {
        const [isOpen, setIsOpen] = useState(false);
        return <MapLegendPanel mapRef={mapRef} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />;
    };

    it('does not render button if heatmap layer is not present', async () => {
        map.getLayer = vi.fn(() => false);

        await act(async () => {
            render(<MapLegendPanelWrapper />);
        });

        expect(screen.queryByLabelText('Show map legend')).not.toBeInTheDocument();
    });

    it('renders button if heatmap layer is present after styledata', async () => {
        await act(async () => {
            render(<MapLegendPanelWrapper />);
        });

        await act(() => {
            map.fire('styledata');
        });

        expect(screen.getByLabelText('Show map legend')).toBeInTheDocument();
    });

    it('shows panel when button is clicked', async () => {
        await act(async () => {
            render(<MapLegendPanelWrapper />);
        });

        await act(() => {
            map.fire('styledata');
        });

        fireEvent.click(screen.getByLabelText('Show map legend'));

        expect(screen.getByText('Legend')).toBeInTheDocument();
        expect(screen.getByText('Location suitability')).toBeInTheDocument();
    });

    it('hides panel when button is clicked again', async () => {
        await act(async () => {
            render(<MapLegendPanelWrapper />);
        });

        await act(() => {
            map.fire('styledata');
        });

        const button = screen.getByLabelText('Show map legend');

        fireEvent.click(button);
        expect(screen.getByText('Legend')).toBeInTheDocument();

        fireEvent.click(button);
        expect(screen.queryByText('Legend')).not.toBeInTheDocument();
    });

    it('displays all legend items with correct colours', async () => {
        await act(async () => {
            render(<MapLegendPanelWrapper />);
        });

        await act(() => {
            map.fire('styledata');
        });

        fireEvent.click(screen.getByLabelText('Show map legend'));

        expect(screen.getByText('Most suitable')).toBeInTheDocument();
        expect(screen.getByText('Moderate suitability')).toBeInTheDocument();
        expect(screen.getByText('Least suitable')).toBeInTheDocument();

        const colorLines = screen.getAllByTestId('color-line');
        expect(colorLines).toHaveLength(3);
        expect(colorLines[0]).toHaveStyle({ backgroundColor: '#4CAF50' });
        expect(colorLines[1]).toHaveStyle({ backgroundColor: '#FF9800' });
        expect(colorLines[2]).toHaveStyle({ backgroundColor: '#F44336' });
    });
});
