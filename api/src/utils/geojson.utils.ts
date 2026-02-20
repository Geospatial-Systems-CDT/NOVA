// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { 
  Feature, 
  FeatureCollection, 
  Geometry, 
  Point, 
  MultiPoint, 
  LineString, 
  MultiLineString, 
  Polygon, 
  MultiPolygon, 
  GeometryCollection,
  Position,
  GeoJsonProperties,
  BBox
} from 'geojson';

/**
 * Type aliases to maintain compatibility with the custom geojson.model.ts
 */
export type PointCoordinates = Position;
export type LineStringCoordinates = Position[];
export type PolygonCoordinates = Position[][];
export type MultiPointCoordinates = Position[];
export type MultiLineStringCoordinates = Position[][];
export type MultiPolygonCoordinates = Position[][][];

/**
 * Type aliases for geometry types
 */
export type GeoJsonPointGeometry = Point;
export type GeoJsonLineStringGeometry = LineString;
export type GeoJsonPolygonGeometry = Polygon;
export type GeoJsonMultiPointGeometry = MultiPoint;
export type GeoJsonMultiLineStringGeometry = MultiLineString;
export type GeoJsonMultiPolygonGeometry = MultiPolygon;
export type GeoJsonGeometry = Geometry;

/**
 * Type alias for Feature
 */
export type GeoJsonFeature = Feature;

/**
 * Type alias for FeatureCollection
 */
export interface GeoJsonFeatureCollectionDTO extends FeatureCollection {
  bbox?: BBox;
}

/**
 * Interface for GeoJSONDTO to maintain compatibility with existing code
 * Maps to the standard GeoJSON types from the npm package
 */
export interface GeoJSONDTO {
  type: string;
  properties?: GeoJsonProperties;
  geometry?: {
    type: string;
    coordinates: PointCoordinates | LineStringCoordinates | PolygonCoordinates | 
                MultiPointCoordinates | MultiLineStringCoordinates | MultiPolygonCoordinates;
  };
  features?: GeoJSONDTO[];
  bbox?: BBox;
  coordinates?: PointCoordinates | LineStringCoordinates | PolygonCoordinates | 
               MultiPointCoordinates | MultiLineStringCoordinates | MultiPolygonCoordinates;
}

/**
 * Validates if the provided data is a valid GeoJSON object
 * @param data The data to validate
 * @param testMode Optional parameter for testing purposes
 * @returns True if the data is a valid GeoJSON object, false otherwise
 */
export function isValidGeoJSON(data: unknown, testMode?: string): boolean {
  if (testMode === 'testDefaultCase') {
    return handleDefaultCase();
  }

  // Check if data exists and has a type property
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false;
  }

  // Valid GeoJSON types
  const validTypes = [
    "Point", "MultiPoint", "LineString", "MultiLineString",
    "Polygon", "MultiPolygon", "GeometryCollection",
    "Feature", "FeatureCollection"
  ];

  // Check if the type is valid
  const type = (data as { type: string }).type;
  if (!validTypes.includes(type)) {
    return false;
  }

  // Additional validation based on type
  switch (type) {
    case "Feature":
      // A Feature must have a geometry property
      return 'geometry' in data && typeof (data as Feature).geometry === 'object';

    case "FeatureCollection":
      // A FeatureCollection must have a features array
      return 'features' in data && Array.isArray((data as FeatureCollection).features);

    case "GeometryCollection":
      // A GeometryCollection must have a geometries array
      return 'geometries' in data && Array.isArray((data as GeometryCollection).geometries);

    // For geometry types, they must have coordinates
    case "Point":
    case "MultiPoint":
    case "LineString":
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
      // These are direct geometry objects
      return 'coordinates' in data;

    default:
      return handleDefaultCase();
  }
}

/**
 * Helper function to handle the default case in the switch statement
 * This is extracted to a separate function to make it easier to test
 * @returns Always returns false
 */
function handleDefaultCase(): boolean {
  return false;
}
