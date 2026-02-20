// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/**
 * Data models for location information
 */
import { Feature } from 'geojson';

/**
 * @swagger
 * components:
 *   schemas:
 *     LocationDTO:
 *       type: object
 *       description: Represents a location with its geolocation and distance information
 *       properties:
 *         location:
 *           $ref: '#/components/schemas/GeoJSONDTO'
 *           description: GeoJSON representation of the location
 *         name:
 *           type: string
 *           description: Name of the location
 *         distance:
 *           type: number
 *           description: Distance from the provided point in kilometers
 *       required:
 *         - location
 *         - name
 *         - distance
 */
/**
 * LocationDTO interface representing a location with its geolocation and distance information
 */
export interface LocationDTO {
    /**
     * ID of the location
     */
    id: number;

    /**
     * GeoJSON representation of the location
     */
    location: Feature;

    /**
     * Name of the location
     */
    name: string;

    /**
     * Distance from the provided point in kilometers
     */
    distance: number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     LocationsDTO:
 *       type: array
 *       description: Array of LocationDTO objects representing locations
 *       items:
 *         $ref: '#/components/schemas/LocationDTO'
 */
/**
 * LocationsDTO interface representing the complete locations data structure
 * This is an array of LocationDTO objects
 */
export type LocationsDTO = LocationDTO[];
