// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Mock } from 'vitest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userService } from './userService';

const mockUserData = {
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
};

describe('userService', () => {
    const mockFetch = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        window.fetch = mockFetch;
        Object.defineProperty(window, 'location', {
            value: { ...originalLocation, href: '' },
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

    describe('getUserData', () => {
        it('fetches user data successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockUserData,
            });

            const result = await userService.getUserData();
            expect(result).toEqual(mockUserData);
            expect(mockFetch).toHaveBeenCalledWith(`/api/auth/user`);
        });

        it('handles fetch failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
            });

            await expect(userService.getUserData()).rejects.toThrow('Failed to fetch user data');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user data:', expect.any(Error));
        });

        it('handles network error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(userService.getUserData()).rejects.toThrow('Network error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user data:', expect.any(Error));
        });

        it('throws a generic error if thrown error is not an instance of Error', async () => {
            mockFetch.mockImplementationOnce(() => {
                throw 'some string error';
            });
            await expect(userService.getUserData()).rejects.toThrow('Failed to fetch user data');
        });
    });

    describe('logout', () => {
        let originalLocation: Location;
        const originalEnv = { ...import.meta.env };
        let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            vi.restoreAllMocks();
            vi.stubGlobal('fetch', vi.fn());
            vi.stubGlobal('sessionStorage', {
                clear: vi.fn(),
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            });
            originalLocation = window.location;
            // @ts-expect-error test override for window.location
            delete window.location;
            // @ts-expect-error test override for window.location
            window.location = { href: '' };
            Object.assign(import.meta.env, {
                VITE_USER_DATA_URL: '/data/user.json',
                VITE_LOGOUT_URL: '/data/logout.json',
            });
            consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window.location as any) = originalLocation;
            Object.assign(import.meta.env, originalEnv);
            consoleErrorSpy.mockRestore();
        });

        it('clears sessionStorage and redirects on successful logout', async () => {
            const mockRedirectUrl = '/test-logout';
            (fetch as Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, redirectUrl: mockRedirectUrl }),
            });
            const data = await userService.logout();
            expect(sessionStorage.clear).toHaveBeenCalled();
            expect(window.location.href).toBe(mockRedirectUrl);
            expect(data.redirectUrl).toBe(mockRedirectUrl);
        });

        it('does not clear sessionStorage if logout response is not ok', async () => {
            (fetch as Mock).mockResolvedValueOnce({
                ok: false,
                statusText: 'Unauthorized',
                json: () => Promise.resolve({ success: false }),
            });
            await expect(userService.logout()).rejects.toThrow('Failed to logout');
            expect(sessionStorage.clear).not.toHaveBeenCalled();
        });

        it('does not clear sessionStorage if network error occurs', async () => {
            (fetch as Mock).mockRejectedValueOnce(new Error('Network error'));
            await expect(userService.logout()).rejects.toThrow();
            expect(sessionStorage.clear).not.toHaveBeenCalled();
        });

        it('throws a generic error if thrown error is not an instance of Error', async () => {
            (fetch as Mock).mockImplementationOnce(() => {
                throw 'some string error';
            });
            await expect(userService.logout()).rejects.toThrow('Failed to logout');
        });

        it('handles missing redirectUrl in logout response gracefully', async () => {
            (fetch as Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            await expect(userService.logout()).rejects.toThrow();
        });
    });
});
