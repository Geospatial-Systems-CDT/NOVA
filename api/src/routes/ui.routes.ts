// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Request, Response, Router } from 'express';
import { uiController } from '../controllers/ui.controller';

/**
 * Router for UI-related endpoints
 */
export class UIRoutes {
    public router: Router;

    /**
     * Constructor for UIRoutes
     */
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    /**
     * Initialize routes
     */
    private initializeRoutes(): void {
        this.router.get('/ui/search', (req: Request, res: Response) => uiController.searchLocation(req, res));
        this.router.get('/ui/layers', (req: Request, res: Response) => uiController.getLayers(req, res));
        this.router.get('/ui/assets', (req: Request, res: Response) => uiController.getAssets(req, res));
        this.router.get('/ui/substation-geojson', (req: Request, res: Response) => uiController.getSubstationGeoJSON(req, res));
        this.router.get('/ui/power-line-geojson', (req: Request, res: Response) => uiController.getPowerLineGeoJSON(req, res));
        this.router.post('/ui/layer/:layerId', (req: Request, res: Response) => uiController.processLayerGeoJSON(req, res));
        this.router.post('/ui/location/analyse', (req: Request, res: Response) => uiController.analyseLocation(req, res));
        this.router.post('/ui/asset/analyse', (req: Request, res: Response) => uiController.analyseAsset(req, res));
        this.router.post('/ui/substations', (req: Request, res: Response) => uiController.getSubstations(req, res));
    }
}

// Export a singleton instance
export const uiRoutes = new UIRoutes();
