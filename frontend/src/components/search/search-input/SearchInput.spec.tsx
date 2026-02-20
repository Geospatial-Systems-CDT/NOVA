// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchInput from './SearchInput';

describe('SearchInput', () => {
    it('triggers search result callback on selecting a result', async () => {
        const mockOnSearchResultClick = vi.fn();
        const user = userEvent.setup();

        vi.spyOn(window, 'fetch').mockResolvedValueOnce({
            json: async () => [{ name: 'Aberdeen', latitude: 57.1497, longitude: -2.0943, zoom: 10 }],
        } as Response);

        render(<SearchInput onSearchResultClick={mockOnSearchResultClick} />);

        const input = screen.getByRole('combobox');
        await user.type(input, 'Ab');

        await waitFor(() => screen.getByText('Aberdeen'));
        await user.click(screen.getByText('Aberdeen'));

        expect(mockOnSearchResultClick).toHaveBeenCalledWith(57.1497, -2.0943, 10);
    });

    it('does not fetch suggestions if input is less than 2 characters', async () => {
        const mockOnSearchResultClick = vi.fn();
        const fetchMock = vi.spyOn(window, 'fetch');

        render(<SearchInput onSearchResultClick={mockOnSearchResultClick} />);
        const input = screen.getByRole('combobox');

        await userEvent.type(input, 'A');

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('clears suggestions when input is cleared', async () => {
        const mockOnSearchResultClick = vi.fn();

        vi.spyOn(window, 'fetch').mockResolvedValueOnce({
            json: async () => [{ name: 'Aberdeen', latitude: 57.1497, longitude: -2.0943, zoom: 10 }],
        } as Response);

        render(<SearchInput onSearchResultClick={mockOnSearchResultClick} />);
        const input = screen.getByRole('combobox');

        await userEvent.type(input, 'Ab');
        await waitFor(() => screen.getByText('Aberdeen'));

        await userEvent.clear(input);
        await waitFor(() => {
            expect(screen.queryByText('Aberdeen')).not.toBeInTheDocument();
        });
    });

    it('closes dropdown when an option is selected', async () => {
        const mockOnSearchResultClick = vi.fn();
        const user = userEvent.setup();

        vi.spyOn(window, 'fetch').mockResolvedValueOnce({
            json: async () => [{ name: 'Aberdeen', latitude: 57.1497, longitude: -2.0943, zoom: 10 }],
        } as Response);

        render(<SearchInput onSearchResultClick={mockOnSearchResultClick} />);

        const input = screen.getByRole('combobox');
        await user.type(input, 'Ab');

        await waitFor(() => screen.getByText('Aberdeen'));
        await user.click(screen.getByText('Aberdeen'));

        // The dropdown should be closed after selection
        await waitFor(() => {
            expect(screen.queryByText('Aberdeen')).not.toBeInTheDocument();
        });
    });

    it('closes dropdown when input loses focus', async () => {
        const mockOnSearchResultClick = vi.fn();
        const user = userEvent.setup();

        vi.spyOn(window, 'fetch').mockResolvedValueOnce({
            json: async () => [{ name: 'Aberdeen', latitude: 57.1497, longitude: -2.0943, zoom: 10 }],
        } as Response);

        render(<SearchInput onSearchResultClick={mockOnSearchResultClick} />);

        const input = screen.getByRole('combobox');
        await user.type(input, 'Ab');

        await waitFor(() => screen.getByText('Aberdeen'));

        // Click outside to lose focus
        await user.click(document.body);

        // The dropdown should be closed after losing focus
        await waitFor(() => {
            expect(screen.queryByText('Aberdeen')).not.toBeInTheDocument();
        });
    });

    it('clears input value when focus is lost', async () => {
        const mockOnSearchResultClick = vi.fn();
        const user = userEvent.setup();

        render(<SearchInput onSearchResultClick={mockOnSearchResultClick} />);

        const input = screen.getByRole('combobox');
        await user.type(input, 'Aberdeen');

        // Click outside to lose focus
        await user.click(document.body);

        // The input should be cleared when focus is lost (Autocomplete behavior)
        expect(input).toHaveValue('');
    });

    it('shows loading indicator while fetching suggestions', async () => {
        const mockOnSearchResultClick = vi.fn();
        const user = userEvent.setup();

        // Create a delayed promise to test loading state
        let resolvePromise: (value: any) => void;
        const delayedPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });

        vi.spyOn(window, 'fetch').mockReturnValueOnce(
            delayedPromise.then(
                () =>
                    ({
                        json: async () => [{ name: 'Aberdeen', latitude: 57.1497, longitude: -2.0943, zoom: 10 }],
                    }) as Response
            )
        );

        render(<SearchInput onSearchResultClick={mockOnSearchResultClick} />);

        const input = screen.getByRole('combobox');
        await user.type(input, 'Ab');

        // Should show loading indicator
        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        // Resolve the promise
        resolvePromise!({});

        // Loading indicator should disappear
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
    });

    it('handles API errors gracefully', async () => {
        const mockOnSearchResultClick = vi.fn();
        const user = userEvent.setup();

        vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('API Error'));

        render(<SearchInput onSearchResultClick={mockOnSearchResultClick} />);

        const input = screen.getByRole('combobox');
        await user.type(input, 'Ab');

        // Should not crash and should show no options
        await waitFor(() => {
            expect(screen.getByText('No options')).toBeInTheDocument();
        });
    });
});
