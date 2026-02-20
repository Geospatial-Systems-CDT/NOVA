// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { isValidGeoJSON, GeoJSONDTO } from '../src/utils/geojson.utils';

describe('Feature GeoJSON Support', () => {
  it('should validate a Feature with Point geometry', () => {
    // Example from the issue description
    const featureGeoJson: GeoJSONDTO = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [125.6, 10.1]
      },
      "properties": {
        "name": "Dinagat Islands"
      }
    };

    // Verify that the GeoJSON is valid
    expect(isValidGeoJSON(featureGeoJson)).toBe(true);
  });
});
