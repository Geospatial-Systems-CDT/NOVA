// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { userService } from '../../services/userService';
import UserMenu from './UserMenu';

vi.mock('../../services/userService', () => ({
    userService: {
        getUserData: vi.fn(),
        logout: vi.fn(),
    },
}));

const mockUserData = {
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
};

describe('UserMenu', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalLocation = window.location;
    const baseUrl = 'http://localhost';

    beforeEach(() => {
        vi.clearAllMocks();
        (userService.getUserData as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserData);
        (userService.logout as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
        Object.defineProperty(window, 'location', {
            value: { ...originalLocation, href: baseUrl },
            writable: true,
        });
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
    });

    it('shows Anonymous initially', async () => {
        (userService.getUserData as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
        await act(async () => {
            render(<UserMenu />);
        });

        expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });

    it('shows user email after loading', async () => {
        await act(async () => {
            render(<UserMenu />);
        });

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeInTheDocument();
        });
    });

    it('handles fetch failure gracefully', async () => {
        (userService.getUserData as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed to fetch'));

        await act(async () => {
            render(<UserMenu />);
        });

        await waitFor(() => {
            expect(screen.getByText('Anonymous')).toBeInTheDocument();
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch user data:', expect.any(Error));
    });

    it('handles logout', async () => {
        await act(async () => {
            render(<UserMenu />);
        });

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getByLabelText('account of current user'));
            fireEvent.click(screen.getByText('Sign out'));
        });

        expect(userService.logout).toHaveBeenCalled();
    });

    it('handles logout failure gracefully', async () => {
        (userService.logout as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed to logout'));

        await act(async () => {
            render(<UserMenu />);
        });

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getByLabelText('account of current user'));
            fireEvent.click(screen.getByText('Sign out'));
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to logout:', expect.any(Error));
    });
});
