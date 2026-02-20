// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import express, { Application, Router, Request, Response } from "express";
import cors from "cors";
import { healthRoutes } from "./routes/health.routes";
import { uiRoutes } from "./routes/ui.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import {authRoutes} from "./routes/auth.routes";

/**
 * Application class
 */
export class App {
    public app: Application;
    private readonly apiRouter: Router;

    /**
     * Constructor for App
     */
    constructor() {
        this.app = express();
        this.apiRouter = Router();

        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeSwagger();
        this.initializeErrorHandling();
    }


  /**
   * Initialize middlewares
   */
  private initializeMiddlewares(): void {
    // Enable CORS for frontend requests
    this.app.use(cors({
      origin: 'http://localhost:5173', // Frontend origin
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));
    this.app.use(express.json());
  }

    /**
     * Initialize routes
     */
    private initializeRoutes(): void {
        // Add health routes
        this.apiRouter.use(healthRoutes.router);

        // Add Auth routes
        this.apiRouter.use(authRoutes.router);

        // Add UI routes (including layers as a subset)
        this.apiRouter.use(uiRoutes.router);

        // Mount routers
        this.app.use('/api', this.apiRouter);
    }

    /**
     * Initialize Swagger
     */
    private initializeSwagger(): void {
        if (process.env.NODE_ENV === "production") {
            return;
        }

        // Load Swagger tooling only outside production to keep runtime image lean.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { SwaggerConfig } = require("./config/swagger");
        const swaggerConfig = new SwaggerConfig();
        swaggerConfig.setup(this.app);
    }

    /**
     * Initialize error handling
     */
    private initializeErrorHandling(): void {
        // Global error handler - converts errors to JSON responses
        this.app.use(errorMiddleware);

        // 404 handler
        this.app.use((req: Request, res: Response) => {
            res.status(404).json({ error: 'Not found' });
        });
    }
}

// Export a singleton instance
export const app = new App().app;
