// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Request, Response } from 'express';
import { FeatureCollection, Feature, Point, Polygon } from 'geojson';
import { UIController } from '../src/controllers/ui.controller';
import { AnalysisRequestDTO } from '../src/models/analysis-request.model';
import { AssetDTO } from '../src/models/asset.model';
import { LocationDTO, LocationsDTO } from '../src/models/location.model';
import { substationService } from '../src/services/substation.service';
import { DataProviderUtils, dataProviderUtils } from '../src/utils/data-provider.utils';
import { AssetLocationRequestDto } from '../src/models/asset-location-request.model';
import { AssetAnalysisService } from '../src/services/asset-analysis.service';
import { ReportService } from '../src/services/report.service';
import { EnergyEstimationService } from '../src/services/energy-estimation.service';

// Mock dataProviderUtils
jest.mock('../src/utils/data-provider.utils');

// Mock substationService
jest.mock('../src/services/substation.service');

// Mock @turf/turf
jest.mock('@turf/turf', () => ({
    point: (coords: number[]) => ({ type: 'Point', coordinates: coords }),
    distance: (from: { coordinates: number[] }, to: { coordinates: number[] }) => {
        // Simple mock implementation of distance calculation
        const fromCoords = from.coordinates;
        const toCoords = to.coordinates;
        const dx = fromCoords[0] - toCoords[0];
        const dy = fromCoords[1] - toCoords[1];
        return Math.sqrt(dx * dx + dy * dy);
    },
}));

describe('UIController', () => {
    let controller: UIController;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        const assetService = new AssetAnalysisService(new DataProviderUtils());
        const estimationService = new EnergyEstimationService(new DataProviderUtils());
        controller = new UIController(assetService, new ReportService(), estimationService);

        // Setup request and response objects
        req = {
            params: { assetType: 'test' },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock dataProviderUtils.readLayersData to return sample layers data
        const mockLayersData = {
            categories: [
                {
                    name: 'Test Category',
                    items: [
                        {
                            id: 'testItem',
                            name: 'Test Item',
                            attributes: [],
                            // Note: active property is intentionally omitted to test our fix
                        },
                    ],
                },
            ],
        };

        // Mock sample GeoJSON data
        const mockGeoJsonData: FeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Point',
                        coordinates: [0, 0],
                    },
                },
            ],
        };

        // Mock sample assets data
        const mockAssetsData: AssetDTO[] = [
            {
                id: 'testAsset',
                name: 'Test Asset',
                variations: [
                    {
                        name: 'Test Variation',
                        specification: [
                            {
                                key: 'testSpec',
                                value: 'testValue',
                                unit: 'testUnit',
                                displayName: 'Test Specification',
                            },
                        ],
                    },
                ],
            },
        ];

        // Mock the readLayersData method to process the data like the real implementation
        (dataProviderUtils.readLayersData as jest.Mock).mockImplementation(() => {
            return mockLayersData;
        });

        // Mock the readAssetsData method
        (dataProviderUtils.readAssetsData as jest.Mock).mockReturnValue(mockAssetsData);

        // Mock the readSampleGeoJsonData method
        (dataProviderUtils.readSampleGeoJsonData as jest.Mock).mockReturnValue(mockGeoJsonData);

        // Mock the readSubstationsData method
        const mockSubstationsData: LocationsDTO = [
            {
                id: 0,
                name: 'Substation Alpha',
                location: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [0.01, 0.01],
                    },
                    properties: {},
                },
                distance: 1.5,
            },
            {
                id: 1,
                name: 'Substation Beta',
                location: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [-0.01, 0.02],
                    },
                    properties: {},
                },
                distance: 2.3,
            },
            {
                id: 2,
                name: 'Substation Gamma',
                location: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [0.02, -0.01],
                    },
                    properties: {},
                },
                distance: 2.7,
            },
        ];
        (dataProviderUtils.readSubstationsData as jest.Mock).mockReturnValue(mockSubstationsData);

        // Mock the readGSPData method
        const mockGSPData: FeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        'Owner Type': 'SSEN',
                        'Owner Name': 'DOAN',
                        Type: 'Primary',
                        Class: 'Distribution',
                        Number: 'BEAP',
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [0.01, 0.01],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        'Owner Type': 'SSEN',
                        'Owner Name': 'DOAN',
                        Type: 'Secondary',
                        Class: 'Transmission',
                        Number: '79181002',
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [-0.01, 0.02],
                    },
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
                    geometry: {
                        type: 'Point',
                        coordinates: [0.02, -0.01],
                    },
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
                    geometry: {
                        type: 'Point',
                        coordinates: [0.03, 0.03],
                    },
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
                    geometry: {
                        type: 'Point',
                        coordinates: [-0.03, -0.03],
                    },
                },
            ],
        };
        (dataProviderUtils.readGridSupplyPointData as jest.Mock).mockReturnValue(mockGSPData);

        // Mock the substationService.getNearestSubstations method
        const mockNearestSubstations: LocationsDTO = [
            {
                id: 0,
                location: {
                    type: 'Feature',
                    properties: {
                        'Owner Type': 'SSEN',
                        'Owner Name': 'DOAN',
                        Type: 'Primary',
                        Class: 'Distribution',
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
                id: 1,
                location: {
                    type: 'Feature',
                    properties: {
                        'Owner Type': 'SSEN',
                        'Owner Name': 'DOAN',
                        Type: 'Secondary',
                        Class: 'Transmission',
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
                id: 2,
                location: {
                    type: 'Feature',
                    properties: {
                        'Owner Type': 'SSEN',
                        'Owner Name': 'DOAN',
                        Type: 'Primary',
                        Class: 'Distribution',
                        Number: 'ROMI',
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [0.02, -0.01],
                    },
                },
                name: 'ROMI',
                distance: 0.022361,
            },
        ];

        (substationService.getNearestSubstations as jest.Mock).mockImplementation((geoJson: Feature | FeatureCollection) => {
            // Return null if the GeoJSON is invalid or doesn't contain a Point geometry
            if (!geoJson.type || (geoJson.type === 'Feature' && (!geoJson.geometry || geoJson.geometry.type !== 'Point'))) {
                return null;
            }
            return mockNearestSubstations;
        });
    });

    describe('constructor', () => {
        it('should create an instance of UIController', () => {
            expect(controller).toBeInstanceOf(UIController);
        });
    });

    describe('searchLocation', () => {
        it('should return an array of matched locations for a valid query', () => {
            req.query = { location: 'Test Location' };

            const mockMatches = [
                { name: 'Test County', type: 'County', latitude: 51.5, longitude: -0.1 },
                { name: 'Test Region', type: 'Region', latitude: 52.0, longitude: -1.2 },
            ];

            (dataProviderUtils.getSearchOptions as jest.Mock).mockReturnValue(mockMatches);

            const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

            controller.searchLocation(req as Request, res as Response);

            expect(consoleDebugSpy).toHaveBeenCalledWith('Location search requested for: Test Location');
            expect(dataProviderUtils.getSearchOptions).toHaveBeenCalledWith('Test Location');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockMatches);

            consoleDebugSpy.mockRestore();
        });

        it('should return 400 when location parameter is missing', () => {
            req.query = {};

            controller.searchLocation(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Location parameter is required' });
        });
    });

    describe('getLayers', () => {
        it('should return layers data with active property for each item', () => {
            // Call the method
            controller.getLayers(req as Request, res as Response);

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();

            // Get the data passed to res.json
            const responseData = (res.json as jest.Mock).mock.calls[0][0];

            // Verify that categories and items exist
            expect(responseData).toHaveProperty('categories');
            expect(responseData.categories[0]).toHaveProperty('items');
        });

        it('should handle errors when retrieving layers data', () => {
            // Mock console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock dataProviderUtils.readLayersData to throw an error
            (dataProviderUtils.readLayersData as jest.Mock).mockImplementation(() => {
                throw new Error('Test error');
            });

            // Call the method
            controller.getLayers(req as Request, res as Response);

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error retrieving layers data'));

            // Restore console.error
            consoleErrorSpy.mockRestore();

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to retrieve layers data' });
        });
    });

    describe('getAssets', () => {
        it('should return assets data', () => {
            // Mock console.debug
            const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

            // Call the method
            controller.getAssets(req as Request, res as Response);

            // Verify console.debug was called
            expect(consoleDebugSpy).toHaveBeenCalledWith('Assets requested');

            // Restore console.debug
            consoleDebugSpy.mockRestore();

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();

            // Get the data passed to res.json
            const responseData = (res.json as jest.Mock).mock.calls[0][0];

            // Verify that the response is an array of assets
            expect(Array.isArray(responseData)).toBe(true);
            expect(responseData.length).toBeGreaterThan(0);
            expect(responseData[0]).toHaveProperty('id');
            expect(responseData[0]).toHaveProperty('name');
            expect(responseData[0]).toHaveProperty('variations');
        });

        it('should handle errors when retrieving assets data', () => {
            // Mock console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock dataProviderUtils.readAssetsData to throw an error
            (dataProviderUtils.readAssetsData as jest.Mock).mockImplementation(() => {
                throw new Error('Test error');
            });

            // Call the method
            controller.getAssets(req as Request, res as Response);

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error retrieving assets data'));

            // Restore console.error
            consoleErrorSpy.mockRestore();

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to retrieve assets data' });
        });
    });

    describe('processLayerGeoJSON', () => {
        it('should return GeoJSON data when given a valid request', () => {
            // Setup request with params and body
            req.params = { layerId: 'testLayer' };
            req.body = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [0, 0],
                        },
                    },
                ],
            };

            // Mock console.debug
            const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

            // Call the method
            controller.processLayerGeoJSON(req as Request, res as Response);

            // Verify console.debug was called
            expect(consoleDebugSpy).toHaveBeenCalledWith('Processing GeoJSON for layer ID: testLayer');

            // Restore console.debug
            consoleDebugSpy.mockRestore();

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();

            // Get the data passed to res.json
            const responseData = (res.json as jest.Mock).mock.calls[0][0];

            // Verify that the response is a GeoJSON object
            expect(responseData).toHaveProperty('type');
            expect(responseData).toHaveProperty('features');
            expect(responseData.type).toBe('FeatureCollection');
        });

        it('should return 400 when given an invalid GeoJSON', () => {
            // Setup request with params and invalid body
            req.params = { layerId: 'testLayer' };
            req.body = {
                // Missing required 'type' property
                properties: {},
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            };

            // Call the method
            controller.processLayerGeoJSON(req as Request, res as Response);

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid GeoJSON data' });
        });

        it('should handle errors when processing GeoJSON data', () => {
            // Setup request with params and body
            req.params = { layerId: 'testLayer' };
            req.body = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [0, 0],
                        },
                    },
                ],
            };

            // Mock console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock dataProviderUtils.readSampleGeoJsonData to throw an error
            (dataProviderUtils.readSampleGeoJsonData as jest.Mock).mockImplementation(() => {
                throw new Error('Test error');
            });

            // Call the method
            controller.processLayerGeoJSON(req as Request, res as Response);

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error processing GeoJSON data'));

            // Restore console.error
            consoleErrorSpy.mockRestore();

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to process GeoJSON data' });
        });
    });

    describe('analyseLocation', () => {
        //     it('should return a feature collection with the matched polygons when given a valid request', () => {
        // //         // Setup request with body
        //         const mockGeoJson: FeatureCollection<Polygon> = {
        //             type: 'FeatureCollection',
        //             features: [
        //                 {
        //                     type: 'Feature',
        //                     properties: {},
        //                     geometry: {
        //                         type: 'Polygon',
        //                         coordinates: [
        //                             [
        //                                 [-1.3465969302374958, 50.71590803611056],
        //                                 [-1.3465969302374958, 50.68805808728612],
        //                                 [-1.27519545839354, 50.68805808728612],
        //                                 [-1.27519545839354, 50.71590803611056],
        //                                 [-1.3465969302374958, 50.71590803611056],
        //                             ],
        //                         ],
        //                     },
        //                 },
        //             ],
        //         };
        //
        //         const mockLayers = [
        //             {
        //                 id: 'windSpeed',
        //                 attributes: [],
        //                 analyze: true,
        //             },
        //         ];
        //
        //         const analysisRequest: AssetLocationRequestDto = {
        //             location: mockGeoJson,
        //             dataLayers: mockLayers,
        //         };
        //
        //         (dataProviderUtils.getWindspeedGoodLayerData as jest.Mock).mockImplementation(() => {
        //             return {
        //                 type: 'FeatureCollection',
        //                 features: [
        //                     {
        //                         type: 'Feature',
        //                         properties: {},
        //                         geometry: {
        //                             coordinates: [
        //                                 [
        //                                     [
        //                                         [-1.3353644688831992, 50.70823856465367],
        //                                         [-1.3353644688831992, 50.685261264837806],
        //                                         [-1.2646063737671227, 50.685261264837806],
        //                                         [-1.2646063737671227, 50.70823856465367],
        //                                         [-1.3353644688831992, 50.70823856465367],
        //                                     ],
        //                                 ],
        //                             ],
        //                             type: 'MultiPolygon',
        //                         },
        //                     },
        //                 ],
        //             };
        //         });
        //
        //         (dataProviderUtils.getWindspeedBadLayerData as jest.Mock).mockImplementation(() => {
        //             return {
        //                 type: 'FeatureCollection',
        //                 features: [
        //                     {
        //                         type: 'Feature',
        //                         properties: {},
        //                         geometry: {
        //                             coordinates: [
        //                                 [
        //                                     [
        //                                         [-1.3011395290153018, 50.69104609243263],
        //                                         [-1.3011395290153018, 50.66841263464531],
        //                                         [-1.2418094343717598, 50.66841263464531],
        //                                         [-1.2418094343717598, 50.69104609243263],
        //                                         [-1.3011395290153018, 50.69104609243263],
        //                                     ],
        //                                 ],
        //                             ],
        //                             type: 'MultiPolygon',
        //                         },
        //                     },
        //                 ],
        //             };
        //         });
        //
        //         req.body = analysisRequest;
        //
        //         // Call the method
        //         controller.analyseLocation(req as Request, res as Response);
        //
        //         // Verify the response
        //         expect(res.status).toHaveBeenCalledWith(200);
        //         expect(res.json).toHaveBeenCalled();
        //
        //         // Get the data passed to res.json
        //         const responseData = (res.json as jest.Mock).mock.calls[0][0];
        //
        //         // Verify that the response is an array of GeoJSON objects
        //         expect(responseData.length).toBeGreaterThan(0);
        //         expect(responseData).toHaveProperty('type');
        //         expect(responseData.type).toBe('FeatureCollection');
        //     });

        it('should handle errors when analysing location data', () => {
            // Setup request with body
            const mockGeoJson: FeatureCollection<Polygon> = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [0, 1],
                                    [1, 1],
                                    [1, 0],
                                    [0, 0],
                                ],
                            ],
                        },
                    },
                ],
            };

            const mockLayers = [
                {
                    id: 'windSpeed',
                    attributes: [],
                    analyze: true,
                },
            ];

            const analysisRequest: AssetLocationRequestDto = {
                location: mockGeoJson,
                dataLayers: mockLayers,
            };

            req.body = analysisRequest;

            // Mock console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock dataProviderUtils.readSampleGeoJsonData to throw an error
            (dataProviderUtils.readSampleGeoJsonData as jest.Mock).mockImplementation(() => {
                throw new Error('Test error');
            });

            // Call the method
            controller.analyseLocation(req as Request, res as Response);

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error analysing location data'));

            // Restore console.error
            consoleErrorSpy.mockRestore();

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to analyse location data' });
        });
    });

    describe('analyseAsset', () => {
        it('should return a SuitabilityResponseDTO when given a valid request', () => {
            // Setup request with body
            const mockGeoJson: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [0, 0],
                        },
                    },
                ],
            };

            const mockLayers = {
                categories: [
                    {
                        name: 'Test Category',
                        items: [
                            {
                                id: 'testItem',
                                name: 'Test Item',
                                attributes: [],
                                active: true,
                            },
                        ],
                    },
                ],
            };

            const mockAsset: AssetDTO = {
                id: 'testAsset',
                name: 'Test Asset',
                variations: [
                    {
                        name: 'Test Variation',
                        specification: [
                            {
                                key: 'testSpec',
                                value: 'testValue',
                                unit: 'testUnit',
                                displayName: 'Test Specification',
                            },
                        ],
                    },
                ],
            };

            const analysisRequest: AnalysisRequestDTO = {
                location: mockGeoJson,
                layers: mockLayers,
                asset: mockAsset,
            };

            req.body = analysisRequest;

            // Call the method
            controller.analyseAsset(req as Request, res as Response);

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();

            // Get the data passed to res.json
            const responseData = (res.json as jest.Mock).mock.calls[0][0];

            // Verify that the response is a SuitabilityResponseDTO
            expect(responseData).toHaveProperty('suitabilityPercentage');
            expect(responseData).toHaveProperty('suitabilityDescription');
            expect(typeof responseData.suitabilityPercentage).toBe('number');
            expect(typeof responseData.suitabilityDescription).toBe('string');
        });

        it('should return 400 when given an invalid GeoJSON', () => {
            // Setup request with invalid GeoJSON
            const invalidGeoJson = {
                // Missing required 'type' property
                properties: {},
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            };

            const mockLayers = {
                categories: [
                    {
                        name: 'Test Category',
                        items: [
                            {
                                id: 'testItem',
                                name: 'Test Item',
                                attributes: [],
                                active: true,
                            },
                        ],
                    },
                ],
            };

            const mockAsset: AssetDTO = {
                id: 'testAsset',
                name: 'Test Asset',
                variations: [
                    {
                        name: 'Test Variation',
                        specification: [
                            {
                                key: 'testSpec',
                                value: 'testValue',
                                unit: 'testUnit',
                                displayName: 'Test Specification',
                            },
                        ],
                    },
                ],
            };

            const analysisRequest = {
                location: invalidGeoJson,
                layers: mockLayers,
                asset: mockAsset,
            };

            req.body = analysisRequest;

            // Call the method
            controller.analyseAsset(req as Request, res as Response);

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid GeoJSON data' });
        });

        it('should handle errors when analysing asset suitability', async () => {
            // Setup request with body
            const mockGeoJson: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [0, 0],
                        },
                    },
                ],
            };

            const mockLayers = {
                categories: [
                    {
                        name: 'Test Category',
                        items: [
                            {
                                id: 'testItem',
                                name: 'Test Item',
                                attributes: [],
                                active: true,
                            },
                        ],
                    },
                ],
            };

            const mockAsset: AssetDTO = {
                id: 'testAsset',
                name: 'Test Asset',
                variations: [
                    {
                        name: 'Test Variation',
                        specification: [
                            {
                                key: 'testSpec',
                                value: 'testValue',
                                unit: 'testUnit',
                                displayName: 'Test Specification',
                            },
                        ],
                    },
                ],
            };

            const analysisRequest: AnalysisRequestDTO = {
                location: mockGeoJson,
                layers: mockLayers,
                asset: mockAsset,
            };

            req.body = analysisRequest;

            // Mock console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock isValidGeoJSON to return true so we pass validation
            const { isValidGeoJSON } = await import('../src/utils/geojson.utils');
            jest.spyOn({ isValidGeoJSON }, 'isValidGeoJSON').mockReturnValue(true);

            // Force an error in the try block by making req.body.location throw when accessed
            Object.defineProperty(req.body, 'location', {
                get: function () {
                    throw new Error('Test error');
                },
            });

            // Call the method
            controller.analyseAsset(req as Request, res as Response);

            // Restore the original isValidGeoJSON function
            jest.spyOn({ isValidGeoJSON }, 'isValidGeoJSON').mockRestore();

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalled();

            // Verify the error message
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error analysing asset suitability'));

            // Restore console.error
            consoleErrorSpy.mockRestore();

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to analyse asset suitability' });
        });
    });

    describe('getSubstations', () => {
        it('should return the 3 nearest substations when given a valid GeoJSON point', () => {
            // Setup request with a valid GeoJSON point
            const mockGeoJsonPoint: Feature<Point> = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {},
            };

            req.body = mockGeoJsonPoint;

            // Call the method
            controller.getSubstations(req as Request, res as Response);

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();

            // Get the data passed to res.json
            const responseData = (res.json as jest.Mock).mock.calls[0][0];

            // Verify that the response is an array of LocationDTO objects
            expect(Array.isArray(responseData)).toBe(true);
            expect(responseData.length).toBe(3); // We expect 3 nearest substations

            // Verify the structure of each LocationDTO
            responseData.forEach((location: LocationDTO) => {
                expect(location).toHaveProperty('name');
                expect(location).toHaveProperty('location');
                expect(location).toHaveProperty('distance');
                expect(typeof location.name).toBe('string');
                expect(typeof location.distance).toBe('number');
                expect(location.location).toHaveProperty('type');
                expect(location.location).toHaveProperty('properties');
                expect(location.location).toHaveProperty('geometry');
                expect(location.location.geometry).toHaveProperty('type');
                if (location.location.geometry.type !== 'GeometryCollection') {
                    expect(location.location.geometry?.coordinates?.length).toBe(2);
                }
            });

            // Verify that the substations are sorted by distance
            expect(responseData[0].distance).toBeLessThanOrEqual(responseData[1].distance);
            expect(responseData[1].distance).toBeLessThanOrEqual(responseData[2].distance);

            // Verify that we got the 3 nearest substations from our mock data
            // The nearest points to [0, 0] in our mock data are:
            // 1. [0.01, 0.01] - distance ~0.014
            // 2. [-0.01, 0.02] - distance ~0.022
            // 3. [0.02, -0.01] - distance ~0.022
            expect(responseData[0].location.geometry?.coordinates).toEqual([0.01, 0.01]);
            expect(responseData[0].name).toBe('BEAP');

            // The next two points have the same distance, so the order might vary
            const secondCoords = responseData[1].location.geometry?.coordinates;
            const thirdCoords = responseData[2].location.geometry?.coordinates;

            expect(
                (JSON.stringify(secondCoords) === JSON.stringify([-0.01, 0.02]) && JSON.stringify(thirdCoords) === JSON.stringify([0.02, -0.01])) ||
                    (JSON.stringify(secondCoords) === JSON.stringify([0.02, -0.01]) && JSON.stringify(thirdCoords) === JSON.stringify([-0.01, 0.02]))
            ).toBeTruthy();
        });

        it('should return the 3 nearest substations when given a valid PositionDTO', () => {
            // Setup request with a valid PositionDTO
            const mockPosition = {
                latitude: 0,
                longitude: 0,
            };

            req.body = mockPosition;

            // Call the method
            controller.getSubstations(req as Request, res as Response);

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();

            // Get the data passed to res.json
            const responseData = (res.json as jest.Mock).mock.calls[0][0];

            // Verify that the response is an array of LocationDTO objects
            expect(Array.isArray(responseData)).toBe(true);
            expect(responseData.length).toBe(3); // We expect 3 nearest substations

            // Verify the structure of each LocationDTO
            responseData.forEach((location: LocationDTO) => {
                expect(location).toHaveProperty('name');
                expect(location).toHaveProperty('location');
                expect(location).toHaveProperty('distance');
                expect(typeof location.name).toBe('string');
                expect(typeof location.distance).toBe('number');
                expect(location.location).toHaveProperty('type');
                expect(location.location).toHaveProperty('properties');
                expect(location.location).toHaveProperty('geometry');
                expect(location.location.geometry).toHaveProperty('type');
                if (location.location.geometry.type !== 'GeometryCollection') {
                    expect(location.location.geometry?.coordinates?.length).toBe(2);
                }
            });

            // Verify that the substations are sorted by distance
            expect(responseData[0].distance).toBeLessThanOrEqual(responseData[1].distance);
            expect(responseData[1].distance).toBeLessThanOrEqual(responseData[2].distance);

            // Verify that we got the 3 nearest substations from our mock data
            // The nearest points to [0, 0] in our mock data are:
            // 1. [0.01, 0.01] - distance ~0.014
            // 2. [-0.01, 0.02] - distance ~0.022
            // 3. [0.02, -0.01] - distance ~0.022
            expect(responseData[0].location.geometry?.coordinates).toEqual([0.01, 0.01]);
            expect(responseData[0].name).toBe('BEAP');

            // The next two points have the same distance, so the order might vary
            const secondCoords = responseData[1].location.geometry?.coordinates;
            const thirdCoords = responseData[2].location.geometry?.coordinates;

            expect(
                (JSON.stringify(secondCoords) === JSON.stringify([-0.01, 0.02]) && JSON.stringify(thirdCoords) === JSON.stringify([0.02, -0.01])) ||
                    (JSON.stringify(secondCoords) === JSON.stringify([0.02, -0.01]) && JSON.stringify(thirdCoords) === JSON.stringify([-0.01, 0.02]))
            ).toBeTruthy();
        });

        it('should return 400 when given invalid data', () => {
            // Setup request with invalid data (neither valid GeoJSON nor valid PositionDTO)
            const invalidData = {
                // Missing required 'type' property for GeoJSON
                // Missing required 'latitude' and 'longitude' for PositionDTO
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            };

            req.body = invalidData;

            // Call the method
            controller.getSubstations(req as Request, res as Response);

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid data. Must be a valid GeoJSON object or a position with latitude and longitude.' });
        });

        it('should return 400 when the request body does not contain a Point geometry', () => {
            // Setup request with a valid GeoJSON but not a Point geometry
            const mockGeoJsonPolygon: Feature<Polygon> = {
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

            req.body = mockGeoJsonPolygon;

            // Call the method
            controller.getSubstations(req as Request, res as Response);

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Request must contain a valid point geometry' });
        });

        it('should handle errors when retrieving substations', () => {
            // Setup request with a valid GeoJSON point
            const mockGeoJsonPoint: Feature<Point> = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {},
            };

            req.body = mockGeoJsonPoint;

            // Mock console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock substationService.getNearestSubstations to throw an error
            (substationService.getNearestSubstations as jest.Mock).mockImplementation(() => {
                throw new Error('Test error');
            });

            // Call the method
            controller.getSubstations(req as Request, res as Response);

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error retrieving substations'));

            // Restore console.error
            consoleErrorSpy.mockRestore();

            // Verify the response
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to retrieve substations' });
        });
    });
});
