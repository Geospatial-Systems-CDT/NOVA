// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/**
 * Data models for asset information
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SpecificationDTO:
 *       type: object
 *       description: Represents a specific attribute or characteristic of an asset variation
 *       properties:
 *         key:
 *           type: string
 *           description: Key identifier for the specification
 *         value:
 *           type: string
 *           description: Value of the specification
 *         unit:
 *           type: string
 *           description: Unit of measurement for the specification value
 *         displayName:
 *           type: string
 *           description: Human-readable display name for the specification
 *       required:
 *         - key
 *         - value
 *         - unit
 *         - displayName
 */
/**
 * SpecificationDTO interface representing a specific attribute of an asset variation
 */
export interface SpecificationDTO {
    /**
     * Key identifier for the specification
     */
    key: string;

    /**
     * Value of the specification
     */
    value: string;

    /**
     * Unit of measurement for the specification value
     */
    unit: string;

    /**
     * Human-readable display name for the specification
     */
    displayName: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     VariationDTO:
 *       type: object
 *       description: Represents a specific type or model of an asset
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the variation
 *         specification:
 *           type: array
 *           description: List of specifications for this variation
 *           items:
 *             $ref: '#/components/schemas/SpecificationDTO'
 *       required:
 *         - name
 *         - specification
 */
/**
 * VariationDTO interface representing a specific type of asset
 */
export interface VariationDTO {
    /**
     * Name of the variation
     */
    name: string;

    /**
     * List of specifications for this variation
     */
    specification: SpecificationDTO[];
}

/**
 * @swagger
 * components:
 *   schemas:
 *     AssetDTO:
 *       type: object
 *       description: Represents a specific asset type with its variations
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the asset
 *         name:
 *           type: string
 *           description: Human-readable name of the asset
 *         variations:
 *           type: array
 *           description: List of variations for this asset
 *           items:
 *             $ref: '#/components/schemas/VariationDTO'
 *       required:
 *         - id
 *         - name
 *         - variations
 */
/**
 * AssetDTO interface representing a specific asset type
 */
export interface AssetDTO {
    /**
     * Unique identifier for the asset
     */
    id: string;

    /**
     * Human-readable name of the asset
     */
    name: string;

    /**
     * List of variations for this asset
     */
    variations: VariationDTO[];
}

/**
 * @swagger
 * components:
 *   schemas:
 *     AssetsDTO:
 *       type: array
 *       description: Array of AssetDTO objects representing all available assets
 *       items:
 *         $ref: '#/components/schemas/AssetDTO'
 */
/**
 * AssetsDTO interface representing the complete assets data structure
 * This is an array of AssetDTO objects
 */
export type AssetsDTO = AssetDTO[];
