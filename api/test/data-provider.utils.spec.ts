// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import * as fs from 'fs';
import { AssetsDTO } from '../src/models/asset.model';
import { LayersDTO } from '../src/models/layers.model';
import { LocationsDTO } from '../src/models/location.model';
import { dataProviderUtils } from '../src/utils/data-provider.utils';
import { Feature } from 'geojson';

// Mock fs module
jest.mock('fs');

describe('DataProviderUtils', () => {
    // Sample data for mocking file reads
    const mockLayersData: LayersDTO = {
        categories: [
            {
                name: 'Test Category',
                items: [
                    {
                        id: 'testItem',
                        name: 'Test Item',
                        attributes: [],
                    },
                    {
                        id: 'testItem2',
                        name: 'Test Item 2',
                        attributes: [],
                        // active property intentionally omitted to test default value assignment
                    },
                ],
            },
        ],
    };

    const mockAssetsData: AssetsDTO = [
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

    const mockSubstationsData: LocationsDTO = [
        {
            id: 0,
            name: 'Test Substation',
            location: {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {},
            } as Feature,
            distance: 1.5,
        },
    ];

    const mockWindspeedLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {
                    ws_spring1: 4.5,
                },
                geometry: {
                    coordinates: [
                        [
                            [-1.3353644688831992, 50.70823856465367],
                            [-1.3353644688831992, 50.685261264837806],
                            [-1.2646063737671227, 50.685261264837806],
                            [-1.2646063737671227, 50.70823856465367],
                            [-1.3353644688831992, 50.70823856465367],
                        ],
                    ],
                    type: 'Polygon',
                },
            },
            {
                type: 'Feature',
                properties: {
                    ws_spring1: 8,
                },
                geometry: {
                    coordinates: [
                        [
                            [-1.3011395290153018, 50.69104609243263],
                            [-1.3011395290153018, 50.66841263464531],
                            [-1.2418094343717598, 50.66841263464531],
                            [-1.2418094343717598, 50.69104609243263],
                            [-1.3011395290153018, 50.69104609243263],
                        ],
                    ],
                    type: 'Polygon',
                },
            },
        ],
    };

    const mockSpecialAreasOfConservationLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [-1.281658414106687, 50.71330487610129],
                            [-1.281658414106687, 50.70186733241772],
                            [-1.2563473429851797, 50.70186733241772],
                            [-1.2563473429851797, 50.71330487610129],
                            [-1.281658414106687, 50.71330487610129],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
        ],
    };

    const mockSpecialAreasOfConservation1KmLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [-1.28293431783257, 50.714173063987346],
                            [-1.28293431783257, 50.701177307578604],
                            [-1.2549382762238963, 50.701177307578604],
                            [-1.2549382762238963, 50.714173063987346],
                            [-1.28293431783257, 50.714173063987346],
                        ],
                    ],
                },
            },
        ],
    };

    const mockSitesOfSpecialScientificInterestLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [-1.343346457616093, 50.713289971134486],
                            [-1.343346457616093, 50.70376040412796],
                            [-1.3215116161465517, 50.70376040412796],
                            [-1.3215116161465517, 50.713289971134486],
                            [-1.343346457616093, 50.713289971134486],
                        ],
                    ],
                    type: 'Polygon',
                },
            },
        ],
    };

    const mockSitesOfSpecialScientificInterest1KmLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [-1.3441100836511737, 50.71386752595595],
                            [-1.3441100836511737, 50.70326744495887],
                            [-1.3208198470697141, 50.70326744495887],
                            [-1.3208198470697141, 50.71386752595595],
                            [-1.3441100836511737, 50.71386752595595],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
        ],
    };

    const mockAreasOfNaturalBeautyLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [-1.3419963357412428, 50.691229841834996],
                            [-1.3419963357412428, 50.68114467040985],
                            [-1.3241316461090378, 50.68114467040985],
                            [-1.3241316461090378, 50.691229841834996],
                            [-1.3419963357412428, 50.691229841834996],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
        ],
    };

    const mockAreasOfNaturalBeauty1KmLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [-1.342721183047928, 50.69163334609394],
                            [-1.342721183047928, 50.680674670924674],
                            [-1.3235323694318026, 50.680674670924674],
                            [-1.3235323694318026, 50.69163334609394],
                            [-1.342721183047928, 50.69163334609394],
                        ],
                    ],
                    type: 'MutiPolygon',
                },
            },
        ],
    };

    const mockBuiltupAreasLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [-1.314421032212266, 50.70469119871362],
                            [-1.314421032212266, 50.69591132166596],
                            [-1.2943574317247055, 50.69591132166596],
                            [-1.2943574317247055, 50.70469119871362],
                            [-1.314421032212266, 50.70469119871362],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
        ],
    };

    const mockBuiltupAreas1KmLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [-1.3151006805906604, 50.70536658605337],
                            [-1.3151006805906604, 50.69551854205466],
                            [-1.2934632384579174, 50.69551854205466],
                            [-1.2934632384579174, 50.70536658605337],
                            [-1.3151006805906604, 50.70536658605337],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
        ],
    };

    const mockAspectLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {
                    aspect: 5,
                },
                geometry: {
                    coordinates: [
                        [
                            [-1.33, 50.70],
                            [-1.33, 50.69],
                            [-1.32, 50.69],
                            [-1.32, 50.70],
                            [-1.33, 50.70],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
        ],
    };

    const mockSlopesLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {
                    fid: 1,
                    Slope: 12,
                },
                geometry: {
                    coordinates: [
                        [
                            [-1.33, 50.70],
                            [-1.33, 50.69],
                            [-1.32, 50.69],
                            [-1.32, 50.70],
                            [-1.33, 50.70],
                        ],
                    ],
                    type: 'Polygon',
                },
            },
        ],
    };

    beforeEach(() => {
        // Reset all mocks
        jest.resetAllMocks();
    });

    describe('readLayersData', () => {
        it('should read and parse layers data from file', () => {
            // Create a deep copy of the mock data to avoid modifications affecting the original
            const mockData = JSON.parse(JSON.stringify(mockLayersData));

            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

            // Call the method
            const result = dataProviderUtils.readLayersData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('layers.json'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockData);
        });
    });

    describe('readAssetsData', () => {
        it('should read and parse assets data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockAssetsData));

            // Call the method
            const result = dataProviderUtils.readAssetsData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('assets.json'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockAssetsData);
        });
    });

    describe('readSubstationsData', () => {
        it('should read and parse substations data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSubstationsData));

            // Call the method
            const result = dataProviderUtils.readSubstationsData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('substations.json'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockSubstationsData);
        });
    });

    describe('getWindspeedLayerData', () => {
        it('should read and parse the windspeed layer data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockWindspeedLayerData));

            // Call the method
            const result = dataProviderUtils.getWindspeedLayerData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('windspeed.geojson'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockWindspeedLayerData);
        });
    });

    describe('getSpecialAreasOfConservationLayerData', () => {
        it('should read and parse the special areas of conservation layer data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSpecialAreasOfConservationLayerData));

            // Call the method
            const result = dataProviderUtils.getSpecialAreasOfConservationLayerData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('sac.geojson'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockSpecialAreasOfConservationLayerData);
        });
    });

    describe('getSpecialAreasOfConservation1KmLayerData', () => {
        it('should read and parse the special areas of conservation 1 km layer data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSpecialAreasOfConservation1KmLayerData));

            // Call the method
            const result = dataProviderUtils.getSpecialAreasOfConservation1KmLayerData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('sac-1km.geojson'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockSpecialAreasOfConservation1KmLayerData);
        });
    });

    describe('getSiteOfSpecialScientificInterestLayerData', () => {
        it('should read and parse the sites of special scientific interest layer data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSitesOfSpecialScientificInterestLayerData));

            // Call the method
            const result = dataProviderUtils.getSitesOfSpecialScientificInterestLayerData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('sssi.geojson'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockSitesOfSpecialScientificInterestLayerData);
        });
    });

    describe('getSiteOfSpecialScientificInterest1KmLayerData', () => {
        it('should read and parse the sites of special scientific interest 1 km layer data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSitesOfSpecialScientificInterest1KmLayerData));

            // Call the method
            const result = dataProviderUtils.getSitesOfSpecialScientificInterest1KmLayerData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('sssi-1km.geojson'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockSitesOfSpecialScientificInterest1KmLayerData);
        });
    });

    describe('getAreasOfNaturalBeautyLayerData', () => {
        it('should read and parse the areas of natural beauty layer data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockAreasOfNaturalBeautyLayerData));

            // Call the method
            const result = dataProviderUtils.getAreasOfNaturalBeautyLayerData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('areanb.geojson'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockAreasOfNaturalBeautyLayerData);
        });
    });

    describe('getAreasOfNaturalBeauty1KmLayerData', () => {
        it('should read and parse the areas of natural beauty 1 km layer data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockAreasOfNaturalBeauty1KmLayerData));

            // Call the method
            const result = dataProviderUtils.getAreasOfNaturalBeauty1KmLayerData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('areanb-1km.geojson'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockAreasOfNaturalBeauty1KmLayerData);
        });
    });

    describe('getBuiltupAreasLayerData', () => {
        it('should read and parse the built up areas layer data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockBuiltupAreasLayerData));

            // Call the method
            const result = dataProviderUtils.getBuiltupAreasLayerData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('bua.geojson'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockBuiltupAreasLayerData);
        });
    });

    describe('getBuiltupAreas1KmLayerData', () => {
        it('should read and parse the built up areas 1 km layer data from file', () => {
            // Mock fs.readFileSync to return our mock data
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockBuiltupAreas1KmLayerData));

            // Call the method
            const result = dataProviderUtils.getBuiltupAreas1KmLayerData();

            // Verify fs.readFileSync was called with the correct path
            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('bua-1km.geojson'), 'utf8');

            // Verify the result
            expect(result).toEqual(mockBuiltupAreas1KmLayerData);
        });
    });

    describe('getAspectLayerData', () => {
        it('should read and parse the aspect layer data from file', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockAspectLayerData));

            const result = dataProviderUtils.getAspectLayerData();

            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('Aspect_WGS84.geojson'), 'utf8');
            expect(result).toEqual(mockAspectLayerData);
        });
    });

    describe('getSlopesLayerData', () => {
        it('should read and parse the slopes layer data from file', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSlopesLayerData));

            const result = dataProviderUtils.getSlopesLayerData();

            expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('Slopes_WGS84.geojson'), 'utf8');
            expect(result).toEqual(mockSlopesLayerData);
        });
    });
});
