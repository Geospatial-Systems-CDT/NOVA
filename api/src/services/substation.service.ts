// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import * as turf from '@turf/turf';
import {Feature, FeatureCollection, GeoJSON, Point, Position} from 'geojson';
import { LocationsDTO } from '../models/location.model';
import { dataProviderUtils } from '../utils/data-provider.utils';
import { isValidGeoJSON } from '../utils/geojson.utils';

/**
 * Service for substation-related operations
 */
export class SubstationService {
  /**
   * Extract a point from a GeoJSON object
   * @param geoJson The GeoJSON object to extract a point from
   * @returns The extracted point as a Feature<Point> or null if no point could be extracted
   */
  public extractPointFromGeoJSON(geoJson: GeoJSON): Feature<Point> | null {
    if (!isValidGeoJSON(geoJson)) {
      return null;
    }

    // If the GeoJSON is a Feature with a Point geometry
    if (geoJson.type === 'Feature' && 
        geoJson.geometry && 
        geoJson.geometry.type === 'Point') {
      return geoJson as Feature<Point>;
    } 

    // If the GeoJSON is a FeatureCollection with a Point geometry in the first feature
    if (geoJson.type === 'FeatureCollection' && 
        (geoJson as FeatureCollection).features?.length > 0 && 
        (geoJson as FeatureCollection).features[0].geometry?.type === 'Point') {
      return (geoJson as FeatureCollection).features[0] as Feature<Point>;
    } 

    // If the GeoJSON is a Point geometry
    if (geoJson.type === 'Point') {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: (geoJson as Point).coordinates as Position
        },
        properties: {}
      };
    }

    return null;
  }

  /**
   * Find the nearest substations to a point
   * @param point The point to find the nearest substations to
   * @param limit The maximum number of substations to return
   * @returns An array of the nearest substations
   */
  public findNearestSubstations(point: Feature<Point>, limit: number = 3): LocationsDTO {
    // Read GSP data from the GeoJSON file
    const gspData = dataProviderUtils.readGridSupplyPointData() as FeatureCollection;

    // Extract coordinates from the point - we know it's a Point geometry
    const coordinates = point.geometry.coordinates;

    // Create a turf point from the input coordinates
    const from = turf.point(coordinates);

    // Calculate distances for each feature in the GSP data
    const featuresWithDistance = gspData.features
      ?.filter(feature => 
        feature.geometry && 
        (feature.geometry as Point).coordinates && 
        (feature.geometry as Point).coordinates.length > 0
      )
      .map(feature => {
        const to = turf.point((feature.geometry as Point).coordinates);
        const distance = turf.distance(from, to);
        return { feature, distance };
      }) || [];

    // Sort by distance and take the nearest ones
    const nearestFeatures = featuresWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    const handleId = (id: string | number | undefined) : number => {
      if (typeof id === 'number') return id;
      if (typeof id === 'string') {
        const parsed = Number.parseFloat(id);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    }

    // Convert to LocationsDTO format
    return nearestFeatures.map(item => ({
      id: handleId(item.feature.id),
      location: {
        type: 'Feature',
        properties: item.feature.properties || {},
        geometry: item.feature.geometry
      },
      name: [
        item.feature.properties?.Locality,
        item.feature.properties?.['Operating Area'],
        item.feature.properties?.['Owner Name']
      ].filter(part => part !== undefined && part !== '').join('-') || 'Unknown',
      distance:  Number(item.distance.toFixed(2))
    }));
  }

  /**
   * Get the nearest substations to a location
   * @param geoJson The GeoJSON object representing the location
   * @param limit The maximum number of substations to return
   * @returns An array of the nearest substations (empty array if input is invalid)
   */
  public getNearestSubstations(geoJson: GeoJSON, limit: number = 3): LocationsDTO {
    const point = this.extractPointFromGeoJSON(geoJson);

    if (!point) {
      return [];
    }

    return this.findNearestSubstations(point, limit);
  }
}

export const substationService = new SubstationService();
