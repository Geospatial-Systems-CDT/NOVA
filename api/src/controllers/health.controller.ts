// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Request, Response } from "express";

/**
 * Controller for health-related endpoints
 */
export class HealthController {
  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Health Check
   *     description: Returns a JSON object indicating that the service is running.
   *     tags:
   *       - Health
   *     responses:
   *       200:
   *         description: Service is healthy.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: OK
   */
  public healthCheck(req: Request, res: Response): void {
    console.debug("Health check is successful.");
    res.status(200).json({ status: "OK" });
  }
}

// Export a singleton instance
export const healthController = new HealthController();
