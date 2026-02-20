// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/**
 * Data model for suitability analysis response
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SuitabilityResponseDTO:
 *       type: object
 *       description: Represents the result of an asset suitability analysis
 *       properties:
 *         suitabilityPercentage:
 *           type: number
 *           description: Percentage indicating how suitable the asset is for the location
 *         suitabilityDescription:
 *           type: string
 *           description: Textual description of the suitability analysis
 *       required:
 *         - suitabilityPercentage
 *         - suitabilityDescription
 */
/**
 * SuitabilityResponseDTO interface representing the result of an asset suitability analysis
 */
export interface SuitabilityResponseDTO {
    /**
     * Percentage indicating how suitable the asset is for the location
     */
    suitabilityPercentage: number;

    /**
     * Textual description of the suitability analysis
     */
    suitabilityDescription: string;
}
