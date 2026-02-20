// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export interface UserData {
    username: string;
    email: string;
    displayName: string;
}

export interface LogoutResponse {
    redirectUrl: string;
    logoutUrl: string;
}

export const userService = {
    async getUserData(): Promise<UserData> {
        const USER_DATA_URL = import.meta.env.VITE_USER_DATA_URL || '/api/auth/user';

        try {
            const response = await fetch(USER_DATA_URL);
            if (!response.ok) {
                console.error('Error fetching user data:', response.statusText);
                throw new Error('Failed to fetch user data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching user data:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to fetch user data');
        }
    },

    async logout(): Promise<LogoutResponse> {
        const LOGOUT_URL = import.meta.env.VITE_LOGOUT_URL || '/api/auth/logout';

        try {
            const response = await fetch(LOGOUT_URL);

            if (!response.ok) {
                console.error('Error logging out:', response.statusText);
                throw new Error('Failed to logout');
            }

            const data: LogoutResponse = await response.json();

            if (!data.redirectUrl) {
                throw new Error('Missing redirectUrl in logout response');
            }

            sessionStorage.clear();
            await fetch(data.logoutUrl, { method: 'GET', redirect: 'manual', credentials: 'include' });
            window.location.href = data.redirectUrl;
            return data;
        } catch (error) {
            console.error('Failed to logout:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to logout');
        }
    },
};
