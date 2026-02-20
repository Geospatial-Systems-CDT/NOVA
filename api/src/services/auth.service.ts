// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Request } from 'express';
import { envConfig } from '../config/env';
import { UserDTO } from '../models/user.model';

export class AuthService {
    public async getUserDetails(req: Request): Promise<UserDTO> {
        if (envConfig.nodeEnv === 'development') {
            return {
                username: 'local.user',
                email: 'local.user@example.com',
                displayName: 'Local User',
            };
        }

        const accessToken = req.header('X-Auth-Request-Access-Token');
        if (!accessToken) {
            throw new Error('Access token missing or expired');
        }

        const response = await fetch(`${envConfig.identityApiUrl}/api/v1/user-details`, {
            method: 'GET',
            headers: {
                'X-Auth-Request-Access-Token': accessToken,
            },
        });

        if (!response.ok) {
            throw new Error('Error: invalid response received when getting user details.');
        }

        const value = await response.json();
        return {
            username: value.content.username,
            email: value.content.email,
            displayName: value.content.displayName,
        };
    }

    public async logout(): Promise<{ logoutUrl: string; redirectUrl: string }> {
        if (envConfig.nodeEnv === 'development') {
            return { logoutUrl: '/', redirectUrl: '/' };
        }

        const logoutUrl = `${envConfig.landingPageUrl}/oauth2/sign_out`;
        const response = await fetch(`${envConfig.identityApiUrl}/api/v1/links/sign-out`, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}(${response.statusText}) received when fetching sign out links.`);
        }

        const logoutRedirect = await response.json();
        const redirectUrl = logoutRedirect.href;

        return { logoutUrl, redirectUrl };
    }
}
