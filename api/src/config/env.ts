// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/**
 * Environment configuration class
 */
export class EnvConfig {
    // Server configuration
    public readonly nodeEnv: string;
    public readonly port: number;
    public readonly identityApiUrl: string;
    public readonly landingPageUrl: string;

    /**
     * Constructor for EnvConfig
     */
    constructor() {
        // Server configuration
        this.nodeEnv = process.env.NODE_ENV || 'development';
        this.port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
        this.identityApiUrl = process.env.IDENTITY_API_URL || 'http://localhost:3001';
        this.landingPageUrl = process.env.LANDING_PAGE_URL || 'http://localhost:3002';
    }
}

// Export a singleton instance
export const envConfig = new EnvConfig();
