// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Request, Response } from 'express';

/**
 * Error handling middleware
 * Converts errors to JSON responses with 400 status code
 * Logs full error stack to console
 */
export const errorMiddleware = (error: Error, req: Request, res: Response): void => {
    // Log the full error stack to console
    console.error('Error occurred:', error);
    console.error('Stack trace:', error.stack);

    // Send JSON response with 400 status code
    res.status(400).json({
        error: error.message || 'An unexpected error occurred',
    });
};
