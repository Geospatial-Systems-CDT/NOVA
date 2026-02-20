// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Request, Response, Router } from 'express';
import { healthController } from '../controllers/health.controller';
/**
 * Router for health-related endpoints
 */
export class HealthRoutes {
    public router: Router;

    /**
     * Constructor for HealthRoutes
     */
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    /**
     * Initialize routes
     */
    private initializeRoutes(): void {
        this.router.get('/health', (req: Request, res: Response) => healthController.healthCheck(req, res));
    }
}

// Export a singleton instance
export const healthRoutes = new HealthRoutes();
