// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/**
 * Data model for user information
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserDTO:
 *       type: object
 *       description: Represents a user
 *       properties:
 *         username:
 *           type: string
 *           description: Unique username
 *         email:
 *           type: string
 *           description: User email address
 *         displayName:
 *           type: string
 *           description: User's display name
 *       required:
 *         - username
 *         - email
 *         - displayName
 */
export interface UserDTO {
    /**
     * Unique username
     */
    username: string;

    /**
     * User email address
     */
    email: string;

    /**
     * User's display name
     */
    displayName: string;
}
