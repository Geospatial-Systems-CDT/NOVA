// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/**
 * Data models for layer information
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AttributeDTO:
 *       type: object
 *       description: Represents configurable properties of an item
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the attribute
 *         description:
 *           type: string
 *           description: Human-readable description of the attribute
 *         defaultValue:
 *           oneOf:
 *             - type: number
 *             - type: string
 *           description: Default value for the attribute
 *         valueType:
 *           type: string
 *           description: Data type of the attribute value
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Optional list of available options for string attributes
 *       required:
 *         - id
 *         - description
 *         - defaultValue
 *         - valueType
 */
/**
 * AttributeDTO interface representing configurable properties of an item
 */
export interface AttributeDTO {
    /**
     * Unique identifier for the attribute
     */
    id: string;

    /**
     * Human-readable description of the attribute
     */
    description: string;

    /**
     * Default value for the attribute
     */
    defaultValue: number | string;

    /**
     * Data type of the attribute value
     */
    valueType: string;

    /**
     * Optional list of available options for string attributes
     */
    options?: string[];
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ItemDTO:
 *       type: object
 *       description: Represents a specific layer item
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the item
 *         name:
 *           type: string
 *           description: Name of the item
 *         attributes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AttributeDTO'
 *           description: List of configurable attributes for this item
 *       required:
 *         - id
 *         - name
 *         - attributes
 */
/**
 * ItemDTO interface representing a specific layer item
 */
export interface ItemDTO {
    /**
     * Unique identifier for the item
     */
    id: string;

    /**
     * Name of the item
     */
    name: string;

    /**
     * List of configurable attributes for this item
     */
    attributes: AttributeDTO[];
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryDTO:
 *       type: object
 *       description: Represents a group of related items
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the category
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemDTO'
 *           description: List of items in this category
 *       required:
 *         - name
 *         - items
 */
/**
 * CategoryDTO interface representing a group of related items
 */
export interface CategoryDTO {
    /**
     * Name of the category
     */
    name: string;

    /**
     * List of items in this category
     */
    items: ItemDTO[];
}

/**
 * @swagger
 * components:
 *   schemas:
 *     LayersDTO:
 *       type: object
 *       description: Represents the complete layers data structure
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryDTO'
 *           description: List of categories containing layer items
 *       required:
 *         - categories
 */
/**
 * LayersDTO interface representing the complete layers data structure
 */
export interface LayersDTO {
    /**
     * List of categories containing layer items
     */
    categories: CategoryDTO[];
}
