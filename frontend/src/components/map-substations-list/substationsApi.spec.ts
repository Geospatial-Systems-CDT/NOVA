// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubstationResponse } from '../../types/substationResponse';
import { fetchSubstations } from './substationsApi';
import type { Point } from 'geojson';

global.fetch = vi.fn();

describe('substationsApi', () => {
    const mockCoordinates = [-1.234567, 51.234567];
    const mockLocation = {
        geometry: {
            type: 'Point',
            coordinates: mockCoordinates,
        } as Point,
    };
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('fetches substations successfully', async () => {
        const mockSubstations: SubstationResponse[] = [
            { id: 0, name: 'Substation A', distance: '1.5', location: mockLocation },
            { id: 1, name: 'Substation B', distance: '2.3', location: mockLocation },
        ];

        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue(mockSubstations),
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchSubstations(123.456, 78.901);

        expect(global.fetch).toHaveBeenCalledWith('/api/ui/substations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({
                type: 'Point',
                coordinates: [123.456, 78.901],
            }),
        });

        expect(result.items).toEqual([
            { id: 0, name: 'Substation A', distanceFromTurbine: '1.5', coordinates: mockCoordinates },
            { id: 1, name: 'Substation B', distanceFromTurbine: '2.3', coordinates: mockCoordinates },
        ]);
        expect(result.error).toBeNull();
    });

    it('handles API error response', async () => {
        const mockResponse = {
            ok: false,
            status: 500,
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchSubstations(123.456, 78.901);

        expect(result.items).toEqual([]);
        expect(result.error).toBe('Failed to load substations');
        expect(console.error).toHaveBeenCalledWith('Error fetching substations:', expect.any(Error));
    });

    it('handles network error', async () => {
        const networkError = new Error('Network error');
        (global.fetch as any).mockRejectedValue(networkError);

        const result = await fetchSubstations(123.456, 78.901);

        expect(result.items).toEqual([]);
        expect(result.error).toBe('Failed to load substations');
        expect(console.error).toHaveBeenCalledWith('Error fetching substations:', networkError);
    });

    it('handles empty response data', async () => {
        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue([]),
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchSubstations(123.456, 78.901);

        expect(result.items).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('handles single substation response', async () => {
        const mockSubstations: SubstationResponse[] = [{ id: 0, name: 'Single Substation', distance: '0.5', location: mockLocation }];

        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue(mockSubstations),
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchSubstations(0, 0);

        expect(result.items).toEqual([{ id: 0, name: 'Single Substation', distanceFromTurbine: '0.5', coordinates: mockCoordinates }]);
        expect(result.error).toBeNull();
    });

    it('handles JSON parsing error', async () => {
        const mockResponse = {
            ok: true,
            json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchSubstations(123.456, 78.901);

        expect(result.items).toEqual([]);
        expect(result.error).toBe('Failed to load substations');
        expect(console.error).toHaveBeenCalledWith('Error fetching substations:', expect.any(Error));
    });

    it('handles different coordinate values', async () => {
        const mockSubstations: SubstationResponse[] = [{ id: 0, name: 'Test Substation', distance: '1.0', location: mockLocation }];

        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue(mockSubstations),
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchSubstations(-180, -90);

        expect(global.fetch).toHaveBeenCalledWith('/api/ui/substations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({
                type: 'Point',
                coordinates: [-180, -90],
            }),
        });

        expect(result.items).toEqual([{ id: 0, name: 'Test Substation', distanceFromTurbine: '1.0', coordinates: mockCoordinates }]);
        expect(result.error).toBeNull();
    });

    it('handles substations with zero distance', async () => {
        const mockSubstations: SubstationResponse[] = [{ id: 0, name: 'Zero Distance Substation', distance: '0', location: mockLocation }];

        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue(mockSubstations),
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchSubstations(123.456, 78.901);

        expect(result.items).toEqual([{ id: 0, name: 'Zero Distance Substation', distanceFromTurbine: '0', coordinates: mockCoordinates }]);
        expect(result.error).toBeNull();
    });

    it('handles substations with decimal distances', async () => {
        const mockSubstations: SubstationResponse[] = [{ id: 0, name: 'Decimal Distance Substation', distance: '3.14159', location: mockLocation }];

        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue(mockSubstations),
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchSubstations(123.456, 78.901);

        expect(result.items).toEqual([{ id: 0, name: 'Decimal Distance Substation', distanceFromTurbine: '3.14159', coordinates: mockCoordinates }]);
        expect(result.error).toBeNull();
    });
});
