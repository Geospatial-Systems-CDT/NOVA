// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Request, Response } from 'express';
import { UserDTO } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * Controller for authentication-related endpoints
 */
export class AuthController {
    private readonly authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    /**
     * @swagger
     * /api/auth/user:
     *   get:
     *     summary: Get current user details
     *     tags:
     *       - Auth
     *     responses:
     *       200:
     *         description: User details retrieved successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserDTO'
     *       401:
     *         description: Unauthorized
     */
    public async getUser(req: Request, res: Response): Promise<void> {
        try {
            const user: UserDTO = await this.authService.getUserDetails(req);
            res.status(200).json(user);
        } catch (error: unknown) {
            res.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
        }
    }

    /**
     * @swagger
     * /api/auth/logout:
     *   post:
     *     summary: Log out the current user
     *     tags:
     *       - Auth
     *     responses:
     *       200:
     *         description: Logout successful.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 logoutUrl:
     *                   type: string
     *                 redirectUrl:
     *                   type: string
     *       500:
     *         description: Logout failed
     */
    public async logout(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.authService.logout();
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Logout failed' });
        }
    }
}

export const authController = new AuthController(new AuthService());
