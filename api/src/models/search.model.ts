// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/**
 * Data Transfer Object for search matches
 * Contains location name, zoom level, latitude and longitude coordinates
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     SearchOptionDTO:
 *       type: object
 *       description: Contains location name, latitude and longitude coordinates
 *       properties:
 *         name:
 *           type: string
 *           description: Location name
 *         latitude:
 *           type: number
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           description: Longitude coordinate
 *         zoom:
 *            type: number
 *            description: Zoom level
 *       required:
 *         - name
 *         - latitude
 *         - longitude
 *         - zoom
 */
export interface SearchOptionDTO {
    /**
     * Location name
     */
    name: string;
    /**
     * Latitude coordinate
     */
    latitude: number;
    /**
     * Longitude coordinate
     */
    longitude: number;
    /**
     * Zoom level
     */
    zoom: number;
}
