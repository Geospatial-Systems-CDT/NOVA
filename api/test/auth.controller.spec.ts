// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Request, Response } from 'express';
import { AuthController } from '../src/controllers/auth.controller';
import { AuthService } from '../src/services/auth.service';

describe('AuthController', () => {
    let controller: AuthController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let mockAuthService: jest.Mocked<AuthService>;

    beforeEach(() => {
        mockAuthService = {
            getUserDetails: jest.fn(),
            logout: jest.fn(),
        } as jest.Mocked<AuthService>;
        controller = new AuthController(mockAuthService);
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe('getUser', () => {
        it('should return user data on success', async () => {
            const mockUser = { username: 'test', email: 'test@example.com', displayName: 'Test User' };
            mockAuthService.getUserDetails.mockResolvedValueOnce(mockUser);
            await controller.getUser(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it('should return 401 on error', async () => {
            mockAuthService.getUserDetails.mockRejectedValueOnce(new Error('fail'));
            await controller.getUser(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
        });
    });

    describe('logout', () => {
        it('should return logoutUrl and redirectUrl on success', async () => {
            const mockResult = { logoutUrl: '/logout', redirectUrl: '/redirect' };
            mockAuthService.logout.mockResolvedValueOnce(mockResult);
            await controller.logout(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it('should return 500 on error', async () => {
            mockAuthService.logout.mockRejectedValueOnce(new Error('fail'));
            await controller.logout(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
        });
    });
});
