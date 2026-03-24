// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Request, Response } from 'express';
import { isValidGeoJSON } from '../utils/geojson.utils';
import { DataProviderUtils, dataProviderUtils } from '../utils/data-provider.utils';
import { AnalysisRequestDTO } from '../models/analysis-request.model';
import { SuitabilityResponseDTO } from '../models/suitability-response.model';
import { substationService } from '../services/substation.service';
import { GeoJSON } from 'geojson';
import { AssetLocationRequestDto } from '../models/asset-location-request.model';
import { AssetAnalysisService } from '../services/asset-analysis.service';
import { ReportService } from '../services/report.service';
import * as turf from '@turf/turf';
import { EnergyEstimationService } from '../services/energy-estimation.service';
import { AssetEstimationRequestDto } from '../models/asset-estimation-request.model';

/**
 * Controller for UI-related endpoints
 */
export class UIController {
    /**
     * Constructor for UIController
     */
    constructor(
        private readonly assetAnalysisService: AssetAnalysisService,
        private readonly reportService: ReportService,
        private readonly energyEstimationService: EnergyEstimationService
    ) {}

    /**
     * @swagger
     * /api/ui/search:
     *   get:
     *     summary: Search for a location
     *     description: Returns latitude and longitude coordinates for a given location name.
     *     tags:
     *       - UI
     *     parameters:
     *       - in: query
     *         name: location
     *         schema:
     *           type: string
     *         required: true
     *         description: Name of the location to search for
     *     responses:
     *       200:
     *         description: Location coordinates retrieved successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PositionDTO'
     *       400:
     *         description: Bad request - location parameter is missing.
     */
    public searchLocation(req: Request, res: Response): void {
        const query = req.query.location as string;

        if (!query) {
            res.status(400).json({ error: 'Location parameter is required' });
            return;
        }

        console.debug(`Location search requested for: ${query}`);

        const matches = dataProviderUtils.getSearchOptions(query);

        res.status(200).json(matches);
    }

    /**
     * @swagger
     * /api/ui/layers:
     *   get:
     *     summary: Get layers information for presentation in the layer selection panel.
     *     description: Returns layer information.
     *     tags:
     *       - UI
     *     responses:
     *       200:
     *         description: Layers information retrieved successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LayersDTO'
     *       404:
     *         description: Layers data file not found.
     *       500:
     *         description: Internal server error.
     */
    public getLayers(req: Request, res: Response): void {
        const assetType = req.params.assetType;

        console.debug(`Layers requested for asset type: ${assetType}`);

        try {
            // Read the layers data from the JSON file
            const layersData = dataProviderUtils.readLayersData();

            // In a real application, we might filter the data based on assetType
            // For now, we'll just return all the data regardless of assetType

            res.status(200).json(layersData);
        } catch (error) {
            console.error(`Error retrieving layers data: ${error}`);
            res.status(500).json({ error: 'Failed to retrieve layers data' });
        }
    }

    /**
     * @swagger
     * /api/ui/assets:
     *   get:
     *     summary: Get all assets and their attributes
     *     description: Returns all assets and their attributes.
     *     tags:
     *       - UI
     *     responses:
     *       200:
     *         description: Assets retrieved successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Asset'
     *               properties:
     *                 id:
     *                   type: string
     *                   description: Unique identifier for the asset
     *                 name:
     *                   type: string
     *                   description: Human-readable name of the asset
     *                 variations:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       name:
     *                         type: string
     *                         description: Name of the variation
     *                       specification:
     *                         type: array
     *                         items:
     *                           type: object
     *                           properties:
     *                             key:
     *                               type: string
     *                               description: Key identifier for the specification
     *                             value:
     *                               type: string
     *                               description: Value of the specification
     *                             unit:
     *                               type: string
     *                               description: Unit of measurement
     *                             displayName:
     *                               type: string
     *                               description: Human-readable display name
     *       404:
     *         description: Assets data file not found.
     *       500:
     *         description: Internal server error.
     */
    public getAssets(req: Request, res: Response): void {
        console.debug('Assets requested');

        try {
            // Read the assets data from the JSON file
            const assetsData = dataProviderUtils.readAssetsData();

            res.status(200).json(assetsData);
        } catch (error) {
            console.error(`Error retrieving assets data: ${error}`);
            res.status(500).json({ error: 'Failed to retrieve assets data' });
        }
    }

    /**
     * @swagger
     * /api/ui/layer/{layerId}:
     *   post:
     *     summary: Process GeoJSON data for a specific layer
     *     description: Accepts GeoJSON content and returns the same GeoJSON object.
     *     tags:
     *       - UI
     *     parameters:
     *       - in: path
     *         name: layerId
     *         schema:
     *           type: string
     *         required: true
     *         description: ID of the layer to process
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/GeoJSONDTO'
     *     responses:
     *       200:
     *         description: GeoJSON processed successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/GeoJSONDTO'
     *       400:
     *         description: Bad request - invalid GeoJSON data.
     *       500:
     *         description: Internal server error.
     */
    public processLayerGeoJSON(req: Request, res: Response): void {
        const layerId = req.params.layerId;

        console.debug(`Processing GeoJSON for layer ID: ${layerId}`);

        try {
            // Read the sample GeoJSON data from the JSON file
            const geoJsonData = dataProviderUtils.readSampleGeoJsonData();

            // Validate that the data is a valid GeoJSON object
            if (!isValidGeoJSON(req.body)) {
                res.status(400).json({ error: 'Invalid GeoJSON data' });
                return;
            }

            res.status(200).json(geoJsonData);
        } catch (error) {
            console.error(`Error processing GeoJSON data: ${error}`);
            res.status(500).json({ error: 'Failed to process GeoJSON data' });
        }
    }

    /**
     * @swagger
     * /api/ui/substation-geojson:
     *   get:
     *     summary: Get a GeoJSON containing substation data.
     *     description: Returns substation data.
     *     tags:
     *       - UI
     *     responses:
     *       200:
     *         description: Substation data retrieved successfully.
     *       404:
     *         description: Substation data file not found.
     *       500:
     *         description: Internal server error.
     */
    public getSubstationGeoJSON(req: Request, res: Response): void {
        const geoJsonData = dataProviderUtils.readGridSupplyPointData();
        res.status(200).json(geoJsonData);
    }

    /**
     * @swagger
     * /api/ui/power-line-geojson:
     *   get:
     *     summary: Get a GeoJSON containing power line data.
     *     description: Returns power line data.
     *     tags:
     *       - UI
     *     responses:
     *       200:
     *         description: Power line data retrieved successfully.
     *       404:
     *         description: Power line data file not found.
     *       500:
     *         description: Internal server error.
     */
    public getPowerLineGeoJSON(req: Request, res: Response): void {
        const geoJsonData = dataProviderUtils.readPowerLineData();
        res.status(200).json(geoJsonData);
    }

    public getSolarPotentialAtLocation(req: Request, res: Response): void {
        const longitude = Number(req.query.longitude);
        const latitude = Number(req.query.latitude);

        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
            res.status(400).json({ error: 'longitude and latitude query params are required numbers' });
            return;
        }

        try {
            const solarPotentialLayer = dataProviderUtils.getSolarPotentialLayerData();
            const targetPoint = turf.point([longitude, latitude]);

            let pvAnnualKwhPerKwp: number | null = null;

            for (const feature of solarPotentialLayer.features) {
                for (const coordinates of feature.geometry.coordinates) {
                    const polygon = turf.polygon(coordinates);
                    if (turf.booleanPointInPolygon(targetPoint, polygon)) {
                        const value = Number(feature.properties?.pv_annual_kwh_kwp);
                        pvAnnualKwhPerKwp = Number.isFinite(value) ? value : null;
                        break;
                    }
                }

                if (pvAnnualKwhPerKwp !== null) break;
            }

            res.status(200).json({ pvAnnualKwhPerKwp });
        } catch (error) {
            console.error(`Error retrieving solar potential data: ${error}`);
            res.status(500).json({ error: 'Failed to retrieve solar potential data' });
        }
    }

    public estimateAssetContribution(req: Request, res: Response): void {
        try {
            const estimationRequest = req.body as AssetEstimationRequestDto;

            if (
                !estimationRequest ||
                !estimationRequest.selectedSubstation ||
                !Number.isFinite(estimationRequest.latitude) ||
                !Number.isFinite(estimationRequest.longitude)
            ) {
                res.status(400).json({ error: 'Invalid estimation request payload' });
                return;
            }

            const estimation = this.energyEstimationService.estimateAssetContribution(estimationRequest);
            res.status(200).json(estimation);
        } catch (error) {
            console.error(`Error estimating asset contribution: ${error}`);
            res.status(500).json({ error: 'Failed to estimate asset contribution' });
        }
    }

    /**
     * @swagger
     * /api/ui/location/analyse:
     *   post:
     *     summary: Analyse location data for a specific asset type
     *     description: |
     *       Accepts GeoJSON of the selected area, layers configuration, and asset to analyze.
     *       Returns `{ heatmap, report }` where `heatmap` is the full suitability FeatureCollection
     *       and `report` contains candidate regions filtered to at most `maxIssues` distinct issue types
     *       (null when `maxIssues` is not supplied).
     *     tags:
     *       - UI
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AnalysisRequestDTO'
     *     responses:
     *       200:
     *         description: Location analysis completed successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/GeoJSONDTO'
     *       400:
     *         description: Bad request - invalid request data.
     *       500:
     *         description: Internal server error.
     */
    public analyseLocation(req: Request, res: Response): void {
        try {
            const analysisRequest = req.body as AssetLocationRequestDto;

            // Validate that the geoJson is a valid GeoJSON object
            if (!isValidGeoJSON(analysisRequest.location)) {
                res.status(400).json({ error: 'Invalid GeoJSON data' });
                return;
            }

            const heatmap = this.assetAnalysisService.analyzeLocation(analysisRequest);
            const report = analysisRequest.maxIssues !== undefined ? this.reportService.generateReport(heatmap, analysisRequest.maxIssues) : null;

            res.status(200).json({ heatmap, report });
        } catch (error) {
            console.error(`Error analysing location data: ${error}`);
            res.status(500).json({ error: 'Failed to analyse location data' });
        }
    }

    /**
     * @swagger
     * /api/ui/asset/analyse:
     *   post:
     *     summary: Analyse asset suitability for a location
     *     description: Accepts GeoJSON of the selected area, layers configuration, and asset to analyze, returns suitability analysis.
     *     tags:
     *       - UI
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AnalysisRequestDTO'
     *     responses:
     *       200:
     *         description: Asset suitability analysis completed successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuitabilityResponseDTO'
     *       400:
     *         description: Bad request - invalid request data.
     *       500:
     *         description: Internal server error.
     */
    public analyseAsset(req: Request, res: Response): void {
        console.debug('Analysing asset suitability for location');

        try {
            const analysisRequest = req.body as AnalysisRequestDTO;

            // Validate that the geoJson is a valid GeoJSON object
            if (!isValidGeoJSON(analysisRequest.location)) {
                res.status(400).json({ error: 'Invalid GeoJSON data' });
                return;
            }

            // In a real application, we would perform suitability analysis based on the GeoJSON and layers
            // For now, we'll just return a sample suitability response
            const suitabilityResponse: SuitabilityResponseDTO = {
                suitabilityPercentage: 85.5,
                suitabilityDescription: 'This location is highly suitable for the asset based on the provided layers configuration.',
            };

            res.status(200).json(suitabilityResponse);
        } catch (error) {
            console.error(`Error analysing asset suitability: ${error}`);
            res.status(500).json({ error: 'Failed to analyse asset suitability' });
        }
    }

    /**
     * @swagger
     * /api/ui/substations:
     *   post:
     *     summary: Get substations near a location
     *     description: Returns the 3 closest substations to the provided geolocation point.
     *     tags:
     *       - UI
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             oneOf:
     *               - $ref: '#/components/schemas/GeoJSONDTO'
     *               - $ref: '#/components/schemas/PositionDTO'
     *     responses:
     *       200:
     *         description: Substations retrieved successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LocationsDTO'
     *       400:
     *         description: Bad request - invalid data.
     *       500:
     *         description: Internal server error.
     */
    public getSubstations(req: Request, res: Response): void {
        console.debug('Getting substations near location');

        try {
            let geoJson: GeoJSON;

            // Check if the request body is a PositionDTO (has latitude and longitude properties)
            if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
                // Convert PositionDTO to GeoJSON Point
                geoJson = {
                    type: 'Point',
                    coordinates: [req.body.longitude, req.body.latitude],
                };
            } else {
                // Validate that the request body is a valid GeoJSON object
                if (!isValidGeoJSON(req.body)) {
                    res.status(400).json({ error: 'Invalid data. Must be a valid GeoJSON object or a position with latitude and longitude.' });
                    return;
                }
                geoJson = req.body;
            }

            // Get the nearest substations using the substation service
            const substations = substationService.getNearestSubstations(geoJson, 5);

            if (!substations || substations.length === 0) {
                res.status(400).json({ error: 'Request must contain a valid point geometry' });
                return;
            }

            res.status(200).json(substations);
        } catch (error) {
            console.error(`Error retrieving substations: ${error}`);
            res.status(500).json({ error: 'Failed to retrieve substations' });
        }
    }
}

const assetAnalysisService = new AssetAnalysisService(new DataProviderUtils());
export const reportService = new ReportService();
const energyEstimationService = new EnergyEstimationService(new DataProviderUtils());
export const uiController = new UIController(assetAnalysisService, reportService, energyEstimationService);
