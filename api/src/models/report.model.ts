import { BBox, Feature, Polygon } from 'geojson';

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportIssueDTO:
 *       type: object
 *       description: A single issue associated with a candidate region.
 *       properties:
 *         description:
 *           type: string
 *           description: Human-readable description of the issue (from properties.issue on the analysis polygon).
 *         suitability:
 *           type: string
 *           enum: [amber, red, darkRed]
 *           description: Suitability rating that generated this issue.
 *       required:
 *         - description
 *         - suitability
 */
export interface ReportIssueDTO {
    /** Human-readable description e.g. "Too close to built up areas - <= 1km" */
    description: string;
    /** Suitability rating: "amber" | "red" | "darkRed" */
    suitability: string;
    /** Source data layer identifier, e.g. "windSpeed" */
    sourceLayerId?: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportRegionLayerValueDTO:
 *       type: object
 *       description: The computed value for a single active data layer within a candidate region.
 *       properties:
 *         layerId:
 *           type: string
 *           description: The identifier of the data layer (e.g. "windSpeed", "sitesOfSpecialScientificInterest").
 *         label:
 *           type: string
 *           description: Human-readable label for the layer value.
 *         value:
 *           oneOf:
 *             - type: number
 *               nullable: true
 *             - type: string
 *               nullable: true
 *           description: The computed value (wind speed, solar potential, distance to nearest boundary, or text grade such as ALC grade). Null when the value cannot be determined for this region.
 *         unit:
 *           type: string
 *           description: Unit of the value (e.g. "m/s", "kWh/kWp/year", "km").
 *       required:
 *         - layerId
 *         - label
 *         - value
 *         - unit
 */
export interface ReportRegionLayerValueDTO {
    /** Identifier of the data layer, e.g. "windSpeed" */
    layerId: string;
    /** Human-readable label, e.g. "Wind speed" */
    label: string;
    /** Computed value, or null when it cannot be determined */
    value: string | number | null;
    /** Unit string, e.g. "m/s", "kWh/kWp/year", "km" */
    unit: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportRegionDTO:
 *       type: object
 *       description: A candidate region suitable for asset placement, with spatial and issue metadata.
 *       properties:
 *         id:
 *           type: string
 *           description: Stable identifier for the region within this report (e.g. "region-1").
 *         polygon:
 *           $ref: '#/components/schemas/GeoJSONDTO'
 *           description: GeoJSON Feature<Polygon> representing the region boundary.
 *         bbox:
 *           type: array
 *           items:
 *             type: number
 *           minItems: 4
 *           maxItems: 4
 *           description: Bounding box [minLon, minLat, maxLon, maxLat] for map zoom.
 *         areaSqKm:
 *           type: number
 *           description: Area of the region in square kilometres.
 *         issueCount:
 *           type: integer
 *           description: Number of distinct issue types present in this region.
 *         weightedIssueSum:
 *           type: number
 *           description: Sum of configured layer weights for distinct triggering layers in this region.
 *         totalLayerWeight:
 *           type: number
 *           description: Sum of all active layer weights used in the analysis.
 *         suitabilityScore:
 *           type: number
 *           description: Weighted suitability score calculated as weightedIssueSum / totalLayerWeight.
 *         issues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportIssueDTO'
 *           description: Issues present within this region.
 *         layerValues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportRegionLayerValueDTO'
 *           description: Computed values for each active data layer used during analysis.
 *       required:
 *         - id
 *         - polygon
 *         - bbox
 *         - areaSqKm
 *         - issueCount
 *         - weightedIssueSum
 *         - totalLayerWeight
 *         - suitabilityScore
 *         - issues
 *         - layerValues
 */
export interface ReportRegionDTO {
    /** Stable identifier for this region within the report, e.g. "region-1" */
    id: string;
    /** GeoJSON polygon boundary of the region */
    polygon: Feature<Polygon>;
    /** [minLon, minLat, maxLon, maxLat] — pass directly to map library fitBounds */
    bbox: BBox;
    /** Area in square kilometres */
    areaSqKm: number;
    /** Number of distinct issue types present */
    issueCount: number;
    /** Sum of weights for unique triggered layers in this region */
    weightedIssueSum: number;
    /** Sum of all active layer weights */
    totalLayerWeight: number;
    /** Weighted suitability score: weightedIssueSum / totalLayerWeight */
    suitabilityScore: number;
    /** Issues present within this region (empty array for zero-issue regions) */
    issues: ReportIssueDTO[];
    /** Computed values for each active data layer used during analysis */
    layerValues: ReportRegionLayerValueDTO[];
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportAssumptionDTO:
 *       type: object
 *       description: A single user-configured parameter (assumption) used during analysis.
 *       properties:
 *         layerId:
 *           type: string
 *           description: Identifier of the data layer this assumption belongs to.
 *         attributeId:
 *           type: string
 *           description: Identifier of the attribute (e.g. "distanceFromAonb").
 *         label:
 *           type: string
 *           description: Human-readable label for the assumption (e.g. "Distance from AONB").
 *         value:
 *           oneOf:
 *             - type: number
 *             - type: string
 *           description: The value configured by the user.
 *       required:
 *         - layerId
 *         - attributeId
 *         - label
 *         - value
 */
export interface ReportAssumptionDTO {
    /** Identifier of the data layer this assumption belongs to */
    layerId: string;
    /** Identifier of the attribute, e.g. "distanceFromAonb" */
    attributeId: string;
    /** Human-readable label, e.g. "Distance from AONB" */
    label: string;
    /** The value configured by the user */
    value: number | string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportDTO:
 *       type: object
 *       description: Suitability report containing candidate regions filtered by issue count.
 *       properties:
 *         regions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportRegionDTO'
 *           description: Candidate regions with at most maxIssues distinct issues.
 *         totalRegions:
 *           type: integer
 *           description: Total number of candidate regions found across all issue-count levels (0 to maxIssues).
 *         selectedPolygon:
 *           oneOf:
 *             - $ref: '#/components/schemas/GeoJSONDTO'
 *             - nullable: true
 *           description: The polygon selected by the user on the map, or null if no polygon has been selected.
 *         assumptions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportAssumptionDTO'
 *           description: User-configured parameters (e.g. buffer distances) used during analysis.
 *       required:
 *         - regions
 *         - totalRegions
 *         - selectedPolygon
 *         - assumptions
 */
export interface ReportDTO {
    /** Candidate regions, each with at most maxIssues distinct issue types */
    regions: ReportRegionDTO[];
    /** Total number of candidate regions found (equals regions.length since filtering is applied during generation) */
    totalRegions: number;
    /** The polygon drawn by the user on the map, or null if none was provided */
    selectedPolygon: Feature<Polygon> | null;
    /** User-configured parameters (e.g. buffer distances) recorded at the time of analysis */
    assumptions: ReportAssumptionDTO[];
}
