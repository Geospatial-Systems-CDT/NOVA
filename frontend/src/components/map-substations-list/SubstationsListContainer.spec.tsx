// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as MapStore from '../../stores/useMapStore';
import SubstationsListContainer from './SubstationsListContainer';
import * as substationsApi from './substationsApi';

// Mock the fetchSubstations function
vi.mock('./substationsApi', () => ({
    fetchSubstations: vi.fn(),
}));

describe('SubstationsListContainer', () => {
    const longitude = 12.34;
    const latitude = 56.78;

    const mockCoordinates = [-1.234567, 51.234567];
    const mockItems = [
        { id: 0, name: 'Test Substation 1', distanceFromTurbine: '150', coordinates: mockCoordinates },
        { id: 1, name: 'Test Substation 2', distanceFromTurbine: '250', coordinates: mockCoordinates },
    ];

    vi.spyOn(MapStore, 'useMapStore').mockImplementation((selector) =>
        selector({
            markerPosition: { longitude, latitude },
            setSubstations: vi.fn(),
            substations: mockItems,
        } as unknown as MapStore.MapState)
    );

    const setShowSubstationsList = vi.fn();
    const setShowControls = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state when fetching data', async () => {
        // Mock the fetchSubstations function to return a promise that never resolves
        vi.spyOn(substationsApi, 'fetchSubstations').mockImplementation(() => new Promise(() => {}));

        render(<SubstationsListContainer setShowSubstationsList={setShowSubstationsList} setShowControls={setShowControls} />);

        expect(screen.getByText('Loading substations...')).toBeInTheDocument();
    });

    it('renders error state when there is an error', async () => {
        // Mock the fetchSubstations function to return an error
        vi.spyOn(substationsApi, 'fetchSubstations').mockResolvedValue({
            items: [],
            error: 'Test error message',
        });

        render(<SubstationsListContainer setShowSubstationsList={setShowSubstationsList} setShowControls={setShowControls} />);

        await waitFor(() => {
            expect(screen.getByText('Test error message')).toBeInTheDocument();
        });
    });

    it('renders SubstationsList with fetched data', async () => {
        // Mock the fetchSubstations function to return data
        vi.spyOn(substationsApi, 'fetchSubstations').mockResolvedValue({
            items: mockItems,
            error: null,
        });

        render(<SubstationsListContainer setShowSubstationsList={setShowSubstationsList} setShowControls={setShowControls} />);

        await waitFor(() => {
            expect(screen.getByText('Test Substation 1')).toBeInTheDocument();
            expect(screen.getByText('Test Substation 2')).toBeInTheDocument();
            expect(screen.getByText('Distance: 150km')).toBeInTheDocument();
            expect(screen.getByText('Distance: 250km')).toBeInTheDocument();
        });
    });

    it('calls fetchSubstations with the provided coordinates', async () => {
        // Mock the fetchSubstations function to return data
        vi.spyOn(substationsApi, 'fetchSubstations').mockResolvedValue({
            items: mockItems,
            error: null,
        });

        render(<SubstationsListContainer setShowSubstationsList={setShowSubstationsList} setShowControls={setShowControls} />);

        await waitFor(() => {
            expect(substationsApi.fetchSubstations).toHaveBeenCalledWith(longitude, latitude);
        });
    });
});
