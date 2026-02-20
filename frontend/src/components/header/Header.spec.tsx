// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

describe('Header', () => {
    const onOpenPrivacy = vi.fn();
    const mockFetch = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    beforeEach(() => {
        vi.clearAllMocks();
        window.fetch = mockFetch;
    });

    it('renders header with title', () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ email: 'test@example.com' }),
        });

        render(<Header onOpenPrivacy={onOpenPrivacy} />);
        expect(screen.getByAltText('NOVA Logo')).toBeInTheDocument();
    });

    it('handles fetch error gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        render(<Header onOpenPrivacy={onOpenPrivacy} />);
        expect(screen.getByAltText('NOVA Logo')).toBeInTheDocument();

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user data:', expect.any(Error));
        });
    });

    it('renders the NOVA logo', () => {
        render(<Header onOpenPrivacy={onOpenPrivacy} />);
        expect(screen.getByAltText('NOVA Logo')).toBeInTheDocument();
    });

    it('renders the UserMenu component', () => {
        render(<Header onOpenPrivacy={onOpenPrivacy} />);
        expect(screen.getByLabelText('account of current user')).toBeInTheDocument();
    });
});
