// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/**
 * Data model for analysis request
 */
import { GeoJSON } from 'geojson';
import { AssetDTO } from './asset.model';
import { LayersDTO } from './layers.model';

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalysisRequestDTO:
 *       type: object
 *       description: Represents a request for location analysis
 *       properties:
 *         location:
 *           $ref: '#/components/schemas/GeoJSONDTO'
 *           description: GeoJSON of the selected area
 *         layers:
 *           $ref: '#/components/schemas/LayersDTO'
 *           description: Layers configuration for the analysis
 *         asset:
 *           $ref: '#/components/schemas/AssetDTO'
 *           description: Asset to be analyzed
 *       required:
 *         - location
 *         - layers
 *         - asset
 */
export interface AnalysisRequestDTO {
    /**
     * GeoJSON of the selected area
     */
    location: GeoJSON;

    /**
     * Layers configuration for the analysis
     */
    layers: LayersDTO;

    /**
     * Asset to be analyzed
     */
    asset: AssetDTO;
}
