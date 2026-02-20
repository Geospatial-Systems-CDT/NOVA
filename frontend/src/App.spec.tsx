// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./components/map/MapComponent', () => ({
    default: () => <div data-testid="map">Map Component</div>,
}));

describe('App', () => {
    const mockFetch = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    beforeEach(() => {
        vi.clearAllMocks();
        window.fetch = mockFetch;
    });

    it('renders the header and map', () => {
        render(<App />);
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByAltText('NOVA Logo')).toBeInTheDocument();
        expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    it('renders app with header', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ email: 'test@example.com' }),
        });

        render(<App />);
        expect(screen.getByAltText('NOVA Logo')).toBeInTheDocument();
        expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    it('handles fetch error gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        render(<App />);
        expect(screen.getByAltText('NOVA Logo')).toBeInTheDocument();
        expect(screen.getByTestId('map')).toBeInTheDocument();

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user data:', expect.any(Error));
        });
    });
});
