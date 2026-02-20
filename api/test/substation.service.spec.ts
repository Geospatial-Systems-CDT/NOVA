// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Feature, FeatureCollection, GeoJSON, Point, Polygon } from 'geojson';
import { SubstationService } from '../src/services/substation.service';
import { dataProviderUtils } from '../src/utils/data-provider.utils';

jest.mock('../src/utils/data-provider.utils');
jest.mock('@turf/turf', () => ({
    point: (coords: number[]) => ({ type: 'Point', coordinates: coords }),
    distance: (from: { coordinates: number[] }, to: { coordinates: number[] }) => {
        const [fx, fy] = from.coordinates;
        const [tx, ty] = to.coordinates;
        return Math.sqrt((fx - tx) ** 2 + (fy - ty) ** 2);
    },
}));

const createPointFeature = (coordinates: number[]): Feature<Point> => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {},
});

const sharedGSPData: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {
                'Owner Type': 'SSEN',
                'Owner Name': 'DOAN',
                Locality: 'BEAP',
                'Operating Area': '',
                Type: 'Primary',
                Class: 'Distribution',
                Number: 'BEAP',
            },
            geometry: { type: 'Point', coordinates: [0.01, 0.01] },
        },
        {
            type: 'Feature',
            properties: {
                'Owner Type': 'SSEN',
                'Owner Name': 'DOAN',
                Locality: '79181002',
                'Operating Area': '',
                Type: 'Secondary',
                Class: 'Transmission',
                Number: '79181002',
            },
            geometry: { type: 'Point', coordinates: [-0.01, 0.02] },
        },
        {
            type: 'Feature',
            properties: {
                'Owner Type': 'SSEN',
                'Owner Name': 'DOAN',
                Type: 'Primary',
                Class: 'Distribution',
                Number: 'ROMI',
            },
            geometry: { type: 'Point', coordinates: [0.02, -0.01] },
        },
        {
            type: 'Feature',
            properties: {
                'Owner Type': 'SSEN',
                'Owner Name': 'DOAN',
                Type: 'Primary',
                Class: 'Distribution',
                Number: 'DADO',
            },
            geometry: { type: 'Point', coordinates: [0.03, 0.03] },
        },
        {
            type: 'Feature',
            properties: {
                'Owner Type': 'SSEN',
                'Owner Name': 'DOAN',
                Type: 'Primary',
                Class: 'Distribution',
                Number: 'THAM',
            },
            geometry: { type: 'Point', coordinates: [-0.03, -0.03] },
        },
    ],
};

describe('SubstationService', () => {
    let service: SubstationService;

    beforeEach(() => {
        service = new SubstationService();
        (dataProviderUtils.readGridSupplyPointData as jest.Mock).mockReturnValue(sharedGSPData);
    });

    describe('extractPointFromGeoJSON', () => {
        it('should return the Feature with Point geometry', () => {
            const geoJson: Feature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {},
            };

            const result = service.extractPointFromGeoJSON(geoJson);

            expect(result).toEqual(geoJson);
        });

        it('should return the first Feature from a FeatureCollection with Point geometry', () => {
            const point = createPointFeature([0, 0]);
            const geoJson: FeatureCollection = {
                type: 'FeatureCollection',
                features: [point],
            };

            const result = service.extractPointFromGeoJSON(geoJson);

            expect(result).toEqual(point);
        });

        it('should convert a Point geometry to a Feature', () => {
            const geoJson: GeoJSON = {
                type: 'Point',
                coordinates: [0, 0],
            };

            // Mock isValidGeoJSON to return true for this test
            jest.spyOn(jest.requireActual('../src/utils/geojson.utils'), 'isValidGeoJSON').mockReturnValue(true);

            const result = service.extractPointFromGeoJSON(geoJson);

            // Restore the original isValidGeoJSON function
            jest.spyOn(jest.requireActual('../src/utils/geojson.utils'), 'isValidGeoJSON').mockRestore();

            expect(result).toEqual({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {},
            });
        });

        it('should return null for invalid GeoJSON', () => {
            const geoJson = {
                // Missing required 'type' property
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            } as unknown as Feature;

            const result = service.extractPointFromGeoJSON(geoJson);

            expect(result).toBeNull();
        });

        it('should return null for GeoJSON without a Point geometry', () => {
            const geoJson: Feature = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [0, 0],
                            [1, 0],
                            [1, 1],
                            [0, 1],
                            [0, 0],
                        ],
                    ],
                },
                properties: {},
            };

            const result = service.extractPointFromGeoJSON(geoJson);

            expect(result).toBeNull();
        });
    });

    describe('findNearestSubstations', () => {
        it('should find the nearest substations to a Feature with Point geometry', () => {
            const point = createPointFeature([0, 0]);

            const result = service.findNearestSubstations(point);

            expect(result).toHaveLength(3);
            expect(result[0].distance).toBeLessThanOrEqual(result[1].distance);
            expect(result[1].distance).toBeLessThanOrEqual(result[2].distance);
            expect(result[0].name).toBe('BEAP-DOAN');
            expect((result[0].location.geometry as Point)?.coordinates).toEqual([0.01, 0.01]);
            // Round distances for precision
            result.forEach((r) => (r.distance = Number(r.distance.toFixed(6))));
        });

        it('should limit the number of substations returned', () => {
            const point = createPointFeature([0, 0]);

            const result = service.findNearestSubstations(point, 2);

            expect(result).toHaveLength(2);
        });

        it('should handle features without geometry', () => {
            const point = createPointFeature([0, 0]);

            // Mock the readGSPData method with a feature without geometry
            const mockGSPData: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {
                            Number: 'BEAP',
                            Locality: 'BEAP',
                            'Operating Area': '',
                            'Owner Name': undefined,
                        },
                        // Empty geometry that will be filtered out
                        geometry: {
                            type: 'Point',
                            coordinates: [],
                        },
                    },
                    {
                        type: 'Feature',
                        properties: {
                            Number: '79181002',
                            Locality: '79181002',
                            'Operating Area': '',
                            'Owner Name': undefined,
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: [-0.01, 0.02],
                        },
                    },
                ],
            };
            (dataProviderUtils.readGridSupplyPointData as jest.Mock).mockReturnValue(mockGSPData);

            const result = service.findNearestSubstations(point);

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('79181002');
        });
    });

    describe('getNearestSubstations', () => {
        it('should get the nearest substations to a location', () => {
            const geoJson = createPointFeature([0, 0]);

            // Mock the extractPointFromGeoJSON method to return a Feature with Point geometry
            const extractPointSpy = jest.spyOn(service, 'extractPointFromGeoJSON').mockReturnValue({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {},
            } as Feature<Point>);

            // Mock the findNearestSubstations method to return a non-empty array
            const findNearestSpy = jest.spyOn(service, 'findNearestSubstations').mockReturnValue([
                {
                    id: 1,
                    location: {
                        type: 'Feature',
                        properties: {
                            Number: 'BEAP',
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: [0.01, 0.01],
                        },
                    },
                    name: 'BEAP',
                    distance: 0.014142,
                },
                {
                    id: 2,
                    location: {
                        type: 'Feature',
                        properties: {
                            Number: '79181002',
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: [-0.01, 0.02],
                        },
                    },
                    name: '79181002',
                    distance: 0.022361,
                },
                {
                    id: 3,
                    location: {
                        type: 'Feature',
                        properties: {
                            Number: 'ROMI',
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: [0.02, -0.01],
                        },
                    },
                    name: 'ROMI',
                    distance: 0.022362,
                },
            ]);

            const result = service.getNearestSubstations(geoJson);

            // Restore the original methods
            extractPointSpy.mockRestore();
            findNearestSpy.mockRestore();

            expect(result).toHaveLength(3);
            expect(result[0].distance).toBeLessThanOrEqual(result[1].distance);
            expect(result[1].distance).toBeLessThanOrEqual(result[2].distance);
            expect(result[0].name).toBe('BEAP');
            expect((result[0].location.geometry as Point)?.coordinates).toEqual([0.01, 0.01]);
        });

        it('should return an empty array for invalid GeoJSON', () => {
            const geoJson = {
                // Missing required 'type' property
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            } as unknown as Feature;

            const result = service.getNearestSubstations(geoJson);

            expect(result).toEqual([]);
        });

        it('should return an empty array for GeoJSON without a Point geometry', () => {
            const geoJson: Feature<Polygon> = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [0, 0],
                            [1, 0],
                            [1, 1],
                            [0, 1],
                            [0, 0],
                        ],
                    ],
                },
                properties: {},
            };

            const result = service.getNearestSubstations(geoJson);

            expect(result).toEqual([]);
        });
    });
});
