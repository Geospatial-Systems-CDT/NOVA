// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { AssetAnalysisService } from '../src/services/asset-analysis.service';
import { dataProviderUtils } from '../src/utils/data-provider.utils';
import { FeatureCollection, Polygon, GeoJsonProperties, Geometry } from 'geojson';
import { DataLayerDto } from '../src/models/data-layer.model';
import { AssetLocationRequestDto } from '../src/models/asset-location-request.model';

// Mock dataProviderUtils
jest.mock('../src/utils/data-provider.utils');

describe('analyzeLocation', () => {
    let assetAnalysisService: AssetAnalysisService;

    const mockWindspeedLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { ws_spring1: 4.5 },
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.3353644688831992, 50.70823856465367],
                                [-1.3353644688831992, 50.685261264837806],
                                [-1.2646063737671227, 50.685261264837806],
                                [-1.2646063737671227, 50.70823856465367],
                                [-1.3353644688831992, 50.70823856465367],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
            {
                type: 'Feature',
                properties: { ws_spring1: 3.5 },
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.33461711915146, 50.685218148192405],
                                [-1.33461711915146, 50.66635806243448],
                                [-1.264591217818861, 50.66635806243448],
                                [-1.264591217818861, 50.685218148192405],
                                [-1.33461711915146, 50.685218148192405],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
            {
                type: 'Feature',
                properties: { ws_spring1: 6.5 },
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.3011395290153018, 50.69104609243263],
                                [-1.3011395290153018, 50.66841263464531],
                                [-1.2418094343717598, 50.66841263464531],
                                [-1.2418094343717598, 50.69104609243263],
                                [-1.3011395290153018, 50.69104609243263],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
            {
                type: 'Feature',
                properties: { ws_spring1: 8.5 },
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.3010647701177902, 50.691902878625484],
                                [-1.2425384679944784, 50.691902878625484],
                                [-1.2425384679944784, 50.70709380802265],
                                [-1.3010647701177902, 50.70709380802265],
                                [-1.3010647701177902, 50.691902878625484],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
        ],
    };

    const mockSolarPotentialLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { pv_annual_kwh_kwp: 850 },
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.3353644688831992, 50.70823856465367],
                                [-1.3353644688831992, 50.685261264837806],
                                [-1.2646063737671227, 50.685261264837806],
                                [-1.2646063737671227, 50.70823856465367],
                                [-1.3353644688831992, 50.70823856465367],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
            {
                type: 'Feature',
                properties: { pv_annual_kwh_kwp: 950 },
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.3011395290153018, 50.69104609243263],
                                [-1.3011395290153018, 50.66841263464531],
                                [-1.2418094343717598, 50.66841263464531],
                                [-1.2418094343717598, 50.69104609243263],
                                [-1.3011395290153018, 50.69104609243263],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.3010647701177902, 50.691902878625484],
                                [-1.2425384679944784, 50.691902878625484],
                                [-1.2425384679944784, 50.70709380802265],
                                [-1.3010647701177902, 50.70709380802265],
                                [-1.3010647701177902, 50.691902878625484],
                            ],
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
                properties: { aspect: 5 },
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.336, 50.709],
                                [-1.336, 50.700],
                                [-1.328, 50.700],
                                [-1.328, 50.709],
                                [-1.336, 50.709],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
            {
                type: 'Feature',
                properties: { aspect: 7 },
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.327, 50.709],
                                [-1.327, 50.700],
                                [-1.319, 50.700],
                                [-1.319, 50.709],
                                [-1.327, 50.709],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
            {
                type: 'Feature',
                properties: { aspect: 1 },
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.318, 50.709],
                                [-1.318, 50.700],
                                [-1.310, 50.700],
                                [-1.310, 50.709],
                                [-1.318, 50.709],
                            ],
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
                properties: { fid: 1, Slope: 12 },
                geometry: {
                    coordinates: [
                        [
                            [-1.336, 50.699],
                            [-1.336, 50.690],
                            [-1.328, 50.690],
                            [-1.328, 50.699],
                            [-1.336, 50.699],
                        ],
                    ],
                    type: 'Polygon',
                },
            },
            {
                type: 'Feature',
                properties: { fid: 2, Slope: 35 },
                geometry: {
                    coordinates: [
                        [
                            [-1.327, 50.699],
                            [-1.327, 50.690],
                            [-1.319, 50.690],
                            [-1.319, 50.699],
                            [-1.327, 50.699],
                        ],
                    ],
                    type: 'Polygon',
                },
            },
        ],
    };

    const mockSpecialAreasOfConvservationLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.281658414106687, 50.71330487610129],
                                [-1.281658414106687, 50.70186733241772],
                                [-1.2563473429851797, 50.70186733241772],
                                [-1.2563473429851797, 50.71330487610129],
                                [-1.281658414106687, 50.71330487610129],
                            ],
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
                    coordinates: [
                        [
                            [
                                [-1.28293431783257, 50.714173063987346],
                                [-1.28293431783257, 50.701177307578604],
                                [-1.2549382762238963, 50.701177307578604],
                                [-1.2549382762238963, 50.714173063987346],
                                [-1.28293431783257, 50.714173063987346],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
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
                            [
                                [-1.343346457616093, 50.713289971134486],
                                [-1.343346457616093, 50.70376040412796],
                                [-1.3215116161465517, 50.70376040412796],
                                [-1.3215116161465517, 50.713289971134486],
                                [-1.343346457616093, 50.713289971134486],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
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
                            [
                                [-1.3441100836511737, 50.71386752595595],
                                [-1.3441100836511737, 50.70326744495887],
                                [-1.3208198470697141, 50.70326744495887],
                                [-1.3208198470697141, 50.71386752595595],
                                [-1.3441100836511737, 50.71386752595595],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
        ],
    };

    const mockAreasOfOutstandingNaturalBeautyLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [
                                [-1.3419963357412428, 50.691229841834996],
                                [-1.3419963357412428, 50.68114467040985],
                                [-1.3241316461090378, 50.68114467040985],
                                [-1.3241316461090378, 50.691229841834996],
                                [-1.3419963357412428, 50.691229841834996],
                            ],
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
                            [
                                [-1.342721183047928, 50.69163334609394],
                                [-1.342721183047928, 50.680674670924674],
                                [-1.3235323694318026, 50.680674670924674],
                                [-1.3235323694318026, 50.69163334609394],
                                [-1.342721183047928, 50.69163334609394],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
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
                            [
                                [-1.314421032212266, 50.70469119871362],
                                [-1.314421032212266, 50.69591132166596],
                                [-1.2943574317247055, 50.69591132166596],
                                [-1.2943574317247055, 50.70469119871362],
                                [-1.314421032212266, 50.70469119871362],
                            ],
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
                            [
                                [-1.3151006805906604, 50.70536658605337],
                                [-1.3151006805906604, 50.69551854205466],
                                [-1.2934632384579174, 50.69551854205466],
                                [-1.2934632384579174, 50.70536658605337],
                                [-1.3151006805906604, 50.70536658605337],
                            ],
                        ],
                    ],
                    type: 'MultiPolygon',
                },
            },
        ],
    };

    const mockIoWPalLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { ALC_GRADE: 'Grade 2' },
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [
                                [-1.334, 50.711],
                                [-1.334, 50.705],
                                [-1.327, 50.705],
                                [-1.327, 50.711],
                                [-1.334, 50.711],
                            ],
                        ],
                    ],
                },
            },
            {
                type: 'Feature',
                properties: { ALC_GRADE: 'Grade 4' },
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [
                                [-1.332, 50.709],
                                [-1.332, 50.703],
                                [-1.325, 50.703],
                                [-1.325, 50.709],
                                [-1.332, 50.709],
                            ],
                        ],
                    ],
                },
            },
        ],
    };

    const mockFuelPovertyLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { percentageOfHousesInFuelPoverty: 8 },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-1.34, 50.71],
                            [-1.34, 50.705],
                            [-1.333, 50.705],
                            [-1.333, 50.71],
                            [-1.34, 50.71],
                        ],
                    ],
                },
            },
            {
                type: 'Feature',
                properties: { percentageOfHousesInFuelPoverty: 12 },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-1.31, 50.7],
                            [-1.31, 50.695],
                            [-1.303, 50.695],
                            [-1.303, 50.7],
                            [-1.31, 50.7],
                        ],
                    ],
                },
            },
        ],
    };

    const mockAncientWoodlandsLayerData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-1.342, 50.712],
                            [-1.342, 50.704],
                            [-1.33, 50.704],
                            [-1.33, 50.712],
                            [-1.342, 50.712],
                        ],
                    ],
                },
            },
        ],
    };

    const drawnLocation: FeatureCollection<Polygon> = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [
                        [
                            [-1.3465969302374958, 50.71590803611056],
                            [-1.3465969302374958, 50.68805808728612],
                            [-1.3147572597099781, 50.67757048191068],
                            [-1.275870815939669, 50.680886907570596],
                            [-1.27519545839354, 50.71590803611056],
                            [-1.3465969302374958, 50.71590803611056],
                        ],
                    ],
                    type: 'Polygon',
                },
            },
        ],
    };

    const dataLayers: DataLayerDto[] = [
        {
            id: 'windSpeed',
            attributes: [
                {
                    id: 'minSpeed',
                    value: 4,
                },
                {
                    id: 'maxSpeed',
                    value: 7.5,
                },
            ],
            analyze: true,
        },
        {
            id: 'specialAreasOfConservation',
            attributes: [
                {
                    id: 'minDistance',
                    value: 1,
                },
            ],
            analyze: true,
        },
        {
            id: 'sitesOfSpecialScientificInterest',
            attributes: [
                {
                    id: 'minDistance',
                    value: 1,
                },
            ],
            analyze: true,
        },
        {
            id: 'builtUpAreas',
            attributes: [
                {
                    id: 'minDistance',
                    value: 1,
                },
            ],
            analyze: true,
        },
        {
            id: 'areasOfOutstandingNaturalBeauty',
            attributes: [
                {
                    id: 'minDistance',
                    value: 1,
                },
            ],
            analyze: true,
        },
        {
            id: 'agriculturalLandClassification',
            attributes: [
                {
                    id: 'classificationThreshold',
                    value: 'Grade 3',
                },
            ],
            analyze: false,
        },
        {
            id: 'fuelPoverty',
            attributes: [],
            analyze: false,
        },
        {
            id: 'ancientWoodlands',
            attributes: [],
            analyze: false,
        },
    ];

    beforeEach(() => {
        jest.resetAllMocks();

        assetAnalysisService = new AssetAnalysisService(dataProviderUtils);

        (dataProviderUtils.getWindspeedLayerData as jest.Mock).mockImplementation(() => mockWindspeedLayerData);
        (dataProviderUtils.getSolarPotentialLayerData as jest.Mock).mockImplementation(() => mockSolarPotentialLayerData);
        (dataProviderUtils.getSpecialAreasOfConservationLayerData as jest.Mock).mockImplementation(() => mockSpecialAreasOfConvservationLayerData);
        (dataProviderUtils.getSpecialAreasOfConservation1KmLayerData as jest.Mock).mockImplementation(() => mockSpecialAreasOfConservation1KmLayerData);
        (dataProviderUtils.getSitesOfSpecialScientificInterestLayerData as jest.Mock).mockImplementation(() => mockSitesOfSpecialScientificInterestLayerData);
        (dataProviderUtils.getSitesOfSpecialScientificInterest1KmLayerData as jest.Mock).mockImplementation(
            () => mockSitesOfSpecialScientificInterest1KmLayerData
        );
        (dataProviderUtils.getBuiltupAreasLayerData as jest.Mock).mockImplementation(() => mockBuiltupAreasLayerData);
        (dataProviderUtils.getBuiltupAreas1KmLayerData as jest.Mock).mockImplementation(() => mockBuiltupAreas1KmLayerData);
        (dataProviderUtils.getAreasOfNaturalBeautyLayerData as jest.Mock).mockImplementation(() => mockAreasOfOutstandingNaturalBeautyLayerData);
        (dataProviderUtils.getAreasOfNaturalBeauty1KmLayerData as jest.Mock).mockImplementation(() => mockAreasOfNaturalBeauty1KmLayerData);
        (dataProviderUtils.getAspectLayerData as jest.Mock).mockImplementation(() => mockAspectLayerData);
        (dataProviderUtils.getSlopesLayerData as jest.Mock).mockImplementation(() => mockSlopesLayerData);
        (dataProviderUtils.getIoWPalLayerData as jest.Mock).mockImplementation(() => mockIoWPalLayerData);
        (dataProviderUtils.getFuelPovertyLayerData as jest.Mock).mockImplementation(() => mockFuelPovertyLayerData);
        (dataProviderUtils.getAncientWoodlandsLayerData as jest.Mock).mockImplementation(() => mockAncientWoodlandsLayerData);
    });

    it('returns only the good layer when no data layers are provided for analysis', () => {
        const noDataLayersToAnalyze = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer, analyze: false };
            return mappedDataLayer;
        });
        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: noDataLayersToAnalyze,
        };

        const result: FeatureCollection<Geometry, GeoJsonProperties> = assetAnalysisService.analyzeLocation(requestDto);
        const expectedResult = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
            ],
        };

        expect(result).toEqual(expectedResult);
    });

    it('returns only the good layer when no other matched polygons are found for the provided location', () => {
        const drawnLocationForNoMatches: FeatureCollection<Polygon> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        coordinates: [
                            [
                                [-1.3965928986904714, 50.67335560403771],
                                [-1.3965928986904714, 50.66525754664215],
                                [-1.3677945231333126, 50.66525754664215],
                                [-1.3677945231333126, 50.67335560403771],
                                [-1.3965928986904714, 50.67335560403771],
                            ],
                        ],
                        type: 'Polygon',
                    },
                },
            ],
        };

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocationForNoMatches,
            dataLayers,
        };
        const expectedResult = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3965928986904714, 50.67335560403771],
                                [-1.3965928986904714, 50.66525754664215],
                                [-1.3677945231333126, 50.66525754664215],
                                [-1.3677945231333126, 50.67335560403771],
                                [-1.3965928986904714, 50.67335560403771],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry, GeoJsonProperties> = assetAnalysisService.analyzeLocation(requestDto);

        expect(result).toEqual(expectedResult);
    });

    it('returns the good layer and the windspeed bad matched polygons when only the windspeed data layer is set to analyze', () => {
        const dataLayersWindspeedOnly = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer };
            if (mappedDataLayer.id !== 'windSpeed') {
                mappedDataLayer.analyze = false;
            }
            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: dataLayersWindspeedOnly,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Bad windspeed - < 4m/s or > 7.5m/s',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.33461711915146, 50.68411208127974],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.2757872910459838, 50.685218148192405],
                                [-1.33461711915146, 50.685218148192405],
                                [-1.33461711915146, 50.68411208127974],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Bad windspeed - < 4m/s or > 7.5m/s',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3010647701177902, 50.691902878625484],
                                [-1.2756583807758117, 50.691902878625484],
                                [-1.2753654345108338, 50.70709380802265],
                                [-1.3010647701177902, 50.70709380802265],
                                [-1.3010647701177902, 50.691902878625484],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issues.length).toBeGreaterThan(0);
        expect(issues.every((properties) => properties?.issue === 'Bad windspeed - < 4m/s or > 7.5m/s')).toBe(true);
        expect(issues.every((properties) => properties?.sourceLayerId === 'windSpeed')).toBe(true);
    });

    it('returns an issue when land classification is above the chosen threshold', () => {
        const locationForAgriculturalCheck: FeatureCollection<Polygon> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.34, 50.712],
                                [-1.34, 50.702],
                                [-1.323, 50.702],
                                [-1.323, 50.712],
                                [-1.34, 50.712],
                            ],
                        ],
                    },
                },
            ],
        };

        const dataLayersAgriculturalOnly = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer, analyze: dataLayer.id === 'agriculturalLandClassification' };

            if (mappedDataLayer.id === 'agriculturalLandClassification') {
                mappedDataLayer.attributes = [{ id: 'classificationThreshold', value: 'Grade 3' }];
            }

            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: locationForAgriculturalCheck,
            dataLayers: dataLayersAgriculturalOnly,
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        expect(result.features[0].properties?.suitability).toEqual('green');

        const agriculturalIssues = result.features.filter(
            (feature) => feature.properties?.issue === 'Agricultural land classification at the selected grade (Grade 3) and better'
        );

        expect(agriculturalIssues).toHaveLength(1);
        expect(agriculturalIssues[0].properties?.suitability).toEqual('red');
    });

    it('includes selected and better grades for agricultural threshold (Grade 4 includes Grades 1-4, excludes Grade 5)', () => {
        const locationForAgriculturalCheck: FeatureCollection<Polygon> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.34, 50.712],
                                [-1.34, 50.702],
                                [-1.323, 50.702],
                                [-1.323, 50.712],
                                [-1.34, 50.712],
                            ],
                        ],
                    },
                },
            ],
        };

        const mockIoWPalLayerDataForThreshold4 = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: { ALC_GRADE: 'Grade 1' },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [-1.3395, 50.7115],
                                    [-1.3395, 50.7085],
                                    [-1.3365, 50.7085],
                                    [-1.3365, 50.7115],
                                    [-1.3395, 50.7115],
                                ],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: { ALC_GRADE: 'Grade 2' },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [-1.336, 50.711],
                                    [-1.336, 50.708],
                                    [-1.333, 50.708],
                                    [-1.333, 50.711],
                                    [-1.336, 50.711],
                                ],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: { ALC_GRADE: 'Grade 4' },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [-1.332, 50.709],
                                    [-1.332, 50.706],
                                    [-1.329, 50.706],
                                    [-1.329, 50.709],
                                    [-1.332, 50.709],
                                ],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: { ALC_GRADE: 'Grade 5' },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [-1.328, 50.7075],
                                    [-1.328, 50.7045],
                                    [-1.325, 50.7045],
                                    [-1.325, 50.7075],
                                    [-1.328, 50.7075],
                                ],
                            ],
                        ],
                    },
                },
            ],
        };

        (dataProviderUtils.getIoWPalLayerData as jest.Mock).mockImplementationOnce(() => mockIoWPalLayerDataForThreshold4);

        const dataLayersAgriculturalOnly = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer, analyze: dataLayer.id === 'agriculturalLandClassification' };

            if (mappedDataLayer.id === 'agriculturalLandClassification') {
                mappedDataLayer.attributes = [{ id: 'classificationThreshold', value: 'Grade 4' }];
            }

            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: locationForAgriculturalCheck,
            dataLayers: dataLayersAgriculturalOnly,
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const agriculturalIssues = result.features.filter(
            (feature) => feature.properties?.issue === 'Agricultural land classification at the selected grade (Grade 4) and better'
        );

        expect(agriculturalIssues).toHaveLength(3);
        agriculturalIssues.forEach((issueFeature) => {
            expect(issueFeature.properties?.suitability).toEqual('red');
        });
    });

    it('returns the special areas of conservation matched polygons when only the special areas of conservation data layer is set to analyze', () => {
        const dataLayersSpecialAreasOfConservationOnly = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer };
            if (mappedDataLayer.id !== 'specialAreasOfConservation') {
                mappedDataLayer.analyze = false;
            }
            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: dataLayersSpecialAreasOfConservationOnly,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to special areas of conservation - <= 1.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.290035828968114, 50.71417284828849],
                                [-1.290033860743947, 50.701177092005445],
                                [-1.2898972820237875, 50.700299752493386],
                                [-1.2894930711182815, 50.6994561522166],
                                [-1.2888367779221104, 50.69867871537879],
                                [-1.287953637861848, 50.69799732162913],
                                [-1.286877600602456, 50.69743815813493],
                                [-1.2856500246201659, 50.69702271369701],
                                [-1.2843180878884957, 50.6967669534638],
                                [-1.2829329756997878, 50.696680705858284],
                                [-1.2755662437770827, 50.696680705858284],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.2894833258490719, 50.71590803611056],
                                [-1.2894956279590897, 50.715893458488814],
                                [-1.2898995385227772, 50.71504999574592],
                                [-1.290035828968114, 50.71417284828849],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to special areas of conservation - <= 1km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.28293431783257, 50.701177307578604],
                                [-1.275479530012268, 50.701177307578604],
                                [-1.275228916096492, 50.714173063987346],
                                [-1.28293431783257, 50.714173063987346],
                                [-1.28293431783257, 50.701177307578604],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Special area of conservation',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.281658414106687, 50.70186733241772],
                                [-1.2754662233742031, 50.70186733241772],
                                [-1.2752456584821532, 50.71330487610129],
                                [-1.281658414106687, 50.71330487610129],
                                [-1.281658414106687, 50.70186733241772],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Close to special areas of conservation - <= 1.5km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Too close to special areas of conservation - <= 1km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Special area of conservation')).toBe(true);
        expect(issues.every((properties) => properties?.sourceLayerId === 'specialAreasOfConservation')).toBe(true);
    });

    it('returns the correct special areas of conservation matched polygons when only the special areas of conservation data layer is set to analyze and the min distance is > 1', () => {
        const dataLayersSpecialAreasOfConservationOnly = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer };
            if (mappedDataLayer.id !== 'specialAreasOfConservation') {
                mappedDataLayer.analyze = false;
            }
            if (mappedDataLayer.id === 'specialAreasOfConservation') {
                mappedDataLayer.attributes = [{ ...mappedDataLayer.attributes[0], value: 2 }];
            }
            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: dataLayersSpecialAreasOfConservationOnly,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to special areas of conservation - <= 2.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3042388507163785, 50.71417112285533],
                                [-1.3042329460444568, 50.701175367262415],
                                [-1.3038224283267723, 50.69854339810738],
                                [-1.302609133262395, 50.6960127376188],
                                [-1.300639811344608, 50.693680637030006],
                                [-1.2979902361437259, 50.691636703323205],
                                [-1.2947622802017549, 50.68995946031554],
                                [-1.2910799951848109, 50.68871333674122],
                                [-1.2870848475701, 50.687946196124926],
                                [-1.2829302923784887, 50.68768750241759],
                                [-1.2757396713067128, 50.68768750241759],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3039694918500142, 50.71590803611056],
                                [-1.3042388507163785, 50.71417112285533],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to special areas of conservation - <= 2km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.29713733997295, 50.71417220124448],
                                [-1.297133403524765, 50.70117644523338],
                                [-1.2968599855569354, 50.69942178266015],
                                [-1.296051342940905, 50.69773462888014],
                                [-1.2947386090767943, 50.6961798251765],
                                [-1.2929722772578156, 50.69481712019279],
                                [-1.2908202546716585, 50.693698875700946],
                                [-1.288365250354558, 50.692868056744366],
                                [-1.285701597771403, 50.692356582977354],
                                [-1.2829316338817967, 50.69218410413795],
                                [-1.2756529575418976, 50.69218410413795],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.2968678878613251, 50.71590803611056],
                                [-1.29713733997295, 50.71417220124448],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Special area of conservation',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.281658414106687, 50.70186733241772],
                                [-1.2754662233742031, 50.70186733241772],
                                [-1.2752456584821532, 50.71330487610129],
                                [-1.281658414106687, 50.71330487610129],
                                [-1.281658414106687, 50.70186733241772],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Close to special areas of conservation - <= 2.5km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Too close to special areas of conservation - <= 2km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Special area of conservation')).toBe(true);
        expect(issues.every((properties) => properties?.sourceLayerId === 'specialAreasOfConservation')).toBe(true);
    });

    it('returns the sites of special scientific interest matched polygons when only the sites of special scientific interest data layer is set to analyze', () => {
        const dataLayersSitesOfSpecialScientificInterestOnly = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer };
            if (mappedDataLayer.id !== 'sitesOfSpecialScientificInterest') {
                mappedDataLayer.analyze = false;
            }
            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: dataLayersSitesOfSpecialScientificInterestOnly,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to sites of special scientific interest - <= 1.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.699068890642216],
                                [-1.3454941089722765, 50.69885711520889],
                                [-1.344108967038382, 50.69877084320827],
                                [-1.3208209636825061, 50.69877084320827],
                                [-1.3194358217486115, 50.69885711520889],
                                [-1.318103862935108, 50.69911289206394],
                                [-1.3168762713182098, 50.69952834510824],
                                [-1.315800223569636, 50.700087509506744],
                                [-1.3149170769012408, 50.70076889729073],
                                [-1.3142607798636532, 50.70154632257843],
                                [-1.3138565670145297, 50.70238990736972],
                                [-1.3137199876975005, 50.70326722936367],
                                [-1.3137183822199283, 50.713867310265414],
                                [-1.313854677283524, 50.71474447524425],
                                [-1.3142586013055353, 50.715587953476096],
                                [-1.3145287249450652, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.699068890642216],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to sites of special scientific interest - <= 1km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3441100836511737, 50.70326744495887],
                                [-1.3208198470697141, 50.70326744495887],
                                [-1.3208198470697141, 50.71386752595595],
                                [-1.3441100836511737, 50.71386752595595],
                                [-1.3441100836511737, 50.70326744495887],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Site of special scientific interest',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.343346457616093, 50.70376040412796],
                                [-1.3215116161465517, 50.70376040412796],
                                [-1.3215116161465517, 50.713289971134486],
                                [-1.343346457616093, 50.713289971134486],
                                [-1.343346457616093, 50.70376040412796],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Close to sites of special scientific interest - <= 1.5km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Too close to sites of special scientific interest - <= 1km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Site of special scientific interest')).toBe(true);
        expect(issues.every((properties) => properties?.sourceLayerId === 'sitesOfSpecialScientificInterest')).toBe(true);
    });

    it('returns the correct sites of special scientific interest matched polygons when only the sites of special scientific interest data layer is set to analyze and the min distance is > 1', () => {
        const dataLayersSitesOfSpecialScientificInterestOnly = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer };
            if (mappedDataLayer.id !== 'sitesOfSpecialScientificInterest') {
                mappedDataLayer.analyze = false;
            }
            if (mappedDataLayer.id === 'sitesOfSpecialScientificInterest') {
                mappedDataLayer.attributes = [{ ...mappedDataLayer.attributes[0], value: 2 }];
            }
            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: dataLayersSitesOfSpecialScientificInterestOnly,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to sites of special scientific interest - <= 2.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.68993273845447],
                                [-1.3441067345984352, 50.689777639707046],
                                [-1.3208231961224528, 50.689777639707046],
                                [-1.3166685517578514, 50.69003640657935],
                                [-1.3126733379334992, 50.690803597041295],
                                [-1.3089910060204424, 50.69204974641762],
                                [-1.305763018592007, 50.69372699212507],
                                [-1.3031134235250015, 50.695770907926274],
                                [-1.3011440900238334, 50.69810297386045],
                                [-1.2999307890583744, 50.70063358789191],
                                [-1.2995202694754167, 50.70326550449504],
                                [-1.299515453043166, 50.71386558484828],
                                [-1.2998321988770751, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68993273845447],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to sites of special scientific interest - <= 2km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.69442927082824],
                                [-1.3441078506874986, 50.69427424145767],
                                [-1.3208220800333892, 50.69427424145767],
                                [-1.318052056674269, 50.69444676908051],
                                [-1.3153883599394014, 50.69495827608456],
                                [-1.3129333243556536, 50.69578911224818],
                                [-1.3107812807848225, 50.69690735854427],
                                [-1.3090149357356657, 50.69827005159377],
                                [-1.307702194169007, 50.699824832195766],
                                [-1.3068935476423291, 50.70151195500457],
                                [-1.3066201284558712, 50.703266582542376],
                                [-1.3066169175008462, 50.713866663229524],
                                [-1.306889246926761, 50.715621009566775],
                                [-1.3070266564953348, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.69442927082824],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Site of special scientific interest',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.343346457616093, 50.70376040412796],
                                [-1.3215116161465517, 50.70376040412796],
                                [-1.3215116161465517, 50.713289971134486],
                                [-1.343346457616093, 50.713289971134486],
                                [-1.343346457616093, 50.70376040412796],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Close to sites of special scientific interest - <= 2.5km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Too close to sites of special scientific interest - <= 2km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Site of special scientific interest')).toBe(true);
        expect(issues.every((properties) => properties?.sourceLayerId === 'sitesOfSpecialScientificInterest')).toBe(true);
    });

    it('returns the built up areas matched polygons when only the built up areas data layer is set to analyze', () => {
        const dataLayersBuiltupAreasOnly = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer };
            if (mappedDataLayer.id !== 'builtUpAreas') {
                mappedDataLayer.analyze = false;
            }
            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: dataLayersBuiltupAreasOnly,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to built up areas - <= 1.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.322200857821111, 50.70536637042981],
                                [-1.322199366936169, 50.69551832651728],
                                [-1.322062812155532, 50.69464101068349],
                                [-1.3216586717770011, 50.69379743133277],
                                [-1.3210024921324883, 50.693020010097705],
                                [-1.320119502905801, 50.6923386244],
                                [-1.3190436461132735, 50.69177945967104],
                                [-1.3178162710418753, 50.69136400358872],
                                [-1.3164845453747596, 50.6911082208795],
                                [-1.3150996435064612, 50.69102194029476],
                                [-1.2934642755421166, 50.69102194029476],
                                [-1.2920793736738183, 50.6911082208795],
                                [-1.2907476480067026, 50.69136400358872],
                                [-1.2895202729353044, 50.69177945967104],
                                [-1.2884444161427768, 50.6923386244],
                                [-1.2875614269160895, 50.693020010097705],
                                [-1.286905247271577, 50.69379743133277],
                                [-1.2865011068930459, 50.69464101068349],
                                [-1.286364552112409, 50.69551832651728],
                                [-1.286363061227467, 50.70536637042981],
                                [-1.2864993335538402, 50.706243541569904],
                                [-1.2869031900296994, 50.707087025243496],
                                [-1.287559126126511, 50.7078644101992],
                                [-1.2884419476653997, 50.70854582353015],
                                [-1.2895177375559044, 50.70910507906579],
                                [-1.2907451585185419, 50.70952068421979],
                                [-1.2920770418063745, 50.70977666649969],
                                [-1.2934622008152197, 50.709863187813276],
                                [-1.3151017182333582, 50.709863187813276],
                                [-1.3164868772422034, 50.70977666649969],
                                [-1.3178187605300362, 50.70952068421979],
                                [-1.3190461814926735, 50.70910507906579],
                                [-1.3201219713831782, 50.70854582353015],
                                [-1.321004792922067, 50.7078644101992],
                                [-1.3216607290188784, 50.707087025243496],
                                [-1.322064585494738, 50.706243541569904],
                                [-1.322200857821111, 50.70536637042981],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to built up areas - <= 1km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3151006805906604, 50.69551854205466],
                                [-1.2934632384579174, 50.69551854205466],
                                [-1.2934632384579174, 50.70536658605337],
                                [-1.3151006805906604, 50.70536658605337],
                                [-1.3151006805906604, 50.69551854205466],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Built up area',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.314421032212266, 50.69591132166596],
                                [-1.2943574317247055, 50.69591132166596],
                                [-1.2943574317247055, 50.70469119871362],
                                [-1.314421032212266, 50.70469119871362],
                                [-1.314421032212266, 50.69591132166596],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Close to built up areas - <= 1.5km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Too close to built up areas - <= 1km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Built up area')).toBe(true);
        expect(issues.every((properties) => properties?.sourceLayerId === 'builtUpAreas')).toBe(true);
    });

    it('returns the correct built up areas matched polygons when only the built up areas data layer is set to analyze and the min distance is > 1', () => {
        const dataLayersBuiltupAreasOnly = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer };
            if (mappedDataLayer.id !== 'builtUpAreas') {
                mappedDataLayer.analyze = false;
            }
            if (mappedDataLayer.id === 'builtUpAreas') {
                mappedDataLayer.attributes = [{ ...mappedDataLayer.attributes[0], value: 2 }];
            }
            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: dataLayersBuiltupAreasOnly,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to built up areas - <= 2.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3364012117596131, 50.70536464553367],
                                [-1.3363967391052167, 50.69551660212582],
                                [-1.3359862934824447, 50.69288470398744],
                                [-1.3347732102237568, 50.69035410623552],
                                [-1.33280422909449, 50.68802205239747],
                                [-1.330155106412726, 50.68597814278345],
                                [-1.3269276917705413, 50.684300896014584],
                                [-1.3232460092829117, 50.68305473746705],
                                [-1.3192514945905454, 50.682287529407255],
                                [-1.3150975700676169, 50.6820287367749],
                                [-1.293466348980961, 50.6820287367749],
                                [-1.2893124244580325, 50.682287529407255],
                                [-1.2853179097656662, 50.68305473746705],
                                [-1.2816362272780366, 50.684300896014584],
                                [-1.278408812635852, 50.68597814278345],
                                [-1.275759689954088, 50.68802205239747],
                                [-1.2757326010309138, 50.68805413641611],
                                [-1.2752653121429534, 50.7122857220471],
                                [-1.2757490140783765, 50.71285916379963],
                                [-1.278397322788641, 50.714903651307765],
                                [-1.2803291758893172, 50.71590803611056],
                                [-1.3282347431592607, 50.71590803611056],
                                [-1.330166596259937, 50.714903651307765],
                                [-1.3328149049702014, 50.71285916379963],
                                [-1.3347822700662055, 50.71052679916369],
                                [-1.3359931765373134, 50.707996208051426],
                                [-1.3364012117596131, 50.70536464553367],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to built up areas - <= 2km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3293010349209606, 50.705365723589885],
                                [-1.329298053151186, 50.695517679874314],
                                [-1.3290246831545216, 50.69376306465158],
                                [-1.3282161816673748, 50.69207595270987],
                                [-1.3269036749511105, 50.69052118019257],
                                [-1.3251376448054248, 50.689158491291735],
                                [-1.3229859831193989, 50.68804024431138],
                                [-1.3205313805562906, 50.68720940205269],
                                [-1.3178681500117926, 50.686697883328485],
                                [-1.3150986066654742, 50.68652533853484],
                                [-1.2934653123831037, 50.68652533853484],
                                [-1.2906957690367853, 50.686697883328485],
                                [-1.2880325384922873, 50.68720940205269],
                                [-1.285577935929179, 50.68804024431138],
                                [-1.283426274243153, 50.689158491291735],
                                [-1.2816602440974674, 50.69052118019257],
                                [-1.280347737381203, 50.69207595270987],
                                [-1.2795392358940563, 50.69376306465158],
                                [-1.2792658658973919, 50.695517679874314],
                                [-1.2792628841276172, 50.705365723589885],
                                [-1.2795351682031637, 50.707120082245396],
                                [-1.2803426601917758, 50.70880709629679],
                                [-1.2816543846826176, 50.710361936134056],
                                [-1.283419975816729, 50.71172484529951],
                                [-1.2855716073344325, 50.712843438891376],
                                [-1.288026596809864, 50.71367471917212],
                                [-1.2906905842889376, 50.71418673050166],
                                [-1.2934611629290138, 50.71435978957315],
                                [-1.3151027561195643, 50.71435978957315],
                                [-1.3178733347596403, 50.71418673050166],
                                [-1.3205373222387138, 50.71367471917212],
                                [-1.3229923117141453, 50.712843438891376],
                                [-1.3251439432318488, 50.71172484529951],
                                [-1.3269095343659603, 50.710361936134056],
                                [-1.328221258856802, 50.70880709629679],
                                [-1.3290287508454142, 50.707120082245396],
                                [-1.3293010349209606, 50.705365723589885],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Built up area',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.314421032212266, 50.69591132166596],
                                [-1.2943574317247055, 50.69591132166596],
                                [-1.2943574317247055, 50.70469119871362],
                                [-1.314421032212266, 50.70469119871362],
                                [-1.314421032212266, 50.69591132166596],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Close to built up areas - <= 2.5km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Too close to built up areas - <= 2km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Built up area')).toBe(true);
        expect(issues.every((properties) => properties?.sourceLayerId === 'builtUpAreas')).toBe(true);
    });

    it('returns the areas of outstanding natural beauty matched polygons when only the areas of outstanding natural beauty data layer is set to analyze', () => {
        const dataLayersAreasOfOutstandingNaturalBeauty = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer };
            if (mappedDataLayer.id !== 'areasOfOutstandingNaturalBeauty') {
                mappedDataLayer.analyze = false;
            }
            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: dataLayersAreasOfOutstandingNaturalBeauty,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to areas of outstanding natural beauty - <= 1.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3174070150129187, 50.67844327950872],
                                [-1.3169764414482035, 50.678953577497694],
                                [-1.3165724373540153, 50.67979714879116],
                                [-1.316435928707519, 50.68067445549985],
                                [-1.3164342710341812, 50.691633130577124],
                                [-1.3165705063914672, 50.69251031084444],
                                [-1.3169742530573112, 50.69335380257869],
                                [-1.317630010386672, 50.69413119353862],
                                [-1.3185125905331647, 50.69481260996058],
                                [-1.319588084965816, 50.695371865007004],
                                [-1.3208151668905117, 50.69578746566083],
                                [-1.3221466796017973, 50.69604343926876],
                                [-1.3235314496676274, 50.696129947866375],
                                [-1.3427221028121035, 50.696129947866375],
                                [-1.3441068728779335, 50.69604343926876],
                                [-1.3454383855892191, 50.69578746566083],
                                [-1.3465969302374958, 50.695395077912615],
                                [-1.3465969302374958, 50.68805808728612],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to areas of outstanding natural beauty - <= 1km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.342721183047928, 50.68678146267331],
                                [-1.3241813705458192, 50.680674670924674],
                                [-1.3235323694318026, 50.680674670924674],
                                [-1.3235323694318026, 50.69163334609394],
                                [-1.342721183047928, 50.69163334609394],
                                [-1.342721183047928, 50.68678146267331],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Area of outstanding natural beauty',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3419963357412428, 50.686542706669115],
                                [-1.3256082576397168, 50.68114467040985],
                                [-1.3241316461090378, 50.68114467040985],
                                [-1.3241316461090378, 50.691229841834996],
                                [-1.3419963357412428, 50.691229841834996],
                                [-1.3419963357412428, 50.686542706669115],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Close to areas of outstanding natural beauty - <= 1.5km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Too close to areas of outstanding natural beauty - <= 1km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Area of outstanding natural beauty')).toBe(true);
        expect(issues.every((properties) => properties?.sourceLayerId === 'areasOfOutstandingNaturalBeauty')).toBe(true);
    });

    it('returns the correct areas of outstanding natural beauty matched polygons when only the areas of outstanding natural beauty data layer is set to analyze and the min distance is > 1', () => {
        const dataLayersAreasOfOutstandingNaturalBeauty = dataLayers.map((dataLayer) => {
            const mappedDataLayer = { ...dataLayer };
            if (mappedDataLayer.id !== 'areasOfOutstandingNaturalBeauty') {
                mappedDataLayer.analyze = false;
            }
            if (mappedDataLayer.id === 'areasOfOutstandingNaturalBeauty') {
                mappedDataLayer.attributes = [{ ...mappedDataLayer.attributes[0], value: 2 }];
            }
            return mappedDataLayer;
        });

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: dataLayersAreasOfOutstandingNaturalBeauty,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to areas of outstanding natural beauty - <= 2.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.302564574040395, 50.67861033363528],
                                [-1.3022430477802078, 50.68067273200999],
                                [-1.3022380747606697, 50.69163140653382],
                                [-1.3026459996815571, 50.69426299641191],
                                [-1.3038565772400812, 50.69679361164121],
                                [-1.3058234063860872, 50.69912599419085],
                                [-1.308470991054108, 50.7011704908533],
                                [-1.3116976294210807, 50.70284850344792],
                                [-1.3153793175330326, 50.70409551524027],
                                [-1.3193745179379903, 50.70486357631306],
                                [-1.3235296094918685, 50.70512315141123],
                                [-1.3427239429878624, 50.70512315141123],
                                [-1.3465969302374958, 50.70488119981221],
                                [-1.3465969302374958, 50.68805808728612],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to areas of outstanding natural beauty - <= 2km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.3100672765454957, 50.677970466558364],
                                [-1.3096127656202672, 50.67891921221285],
                                [-1.309339488113548, 50.680673809194936],
                                [-1.3093361727669937, 50.69163248405707],
                                [-1.3096083831063061, 50.69338686095991],
                                [-1.3104156556473496, 50.695073891110965],
                                [-1.3117270227207087, 50.696628742923686],
                                [-1.31349213111498, 50.697991658231594],
                                [-1.315643171682768, 50.69911025080465],
                                [-1.318097482973981, 50.6999415220498],
                                [-1.320760729133523, 50.70045351601036],
                                [-1.3235305296876736, 50.70062654963882],
                                [-1.342723022792057, 50.70062654963882],
                                [-1.3454928233462078, 50.70045351601036],
                                [-1.3465969302374958, 50.70024125772619],
                                [-1.3465969302374958, 50.68805808728612],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Area of outstanding natural beauty',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3419963357412428, 50.686542706669115],
                                [-1.3256082576397168, 50.68114467040985],
                                [-1.3241316461090378, 50.68114467040985],
                                [-1.3241316461090378, 50.691229841834996],
                                [-1.3419963357412428, 50.691229841834996],
                                [-1.3419963357412428, 50.686542706669115],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Close to areas of outstanding natural beauty - <= 2.5km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Too close to areas of outstanding natural beauty - <= 2km')).toBe(true);
        expect(issues.some((properties) => properties?.issue === 'Area of outstanding natural beauty')).toBe(true);
        expect(issues.every((properties) => properties?.sourceLayerId === 'areasOfOutstandingNaturalBeauty')).toBe(true);
    });

    it('returns all the matched polygons when all the data layers are set to analyze', () => {
        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers,
        };

        const expectedResult: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'green',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to special areas of conservation - <= 1.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.290035828968114, 50.71417284828849],
                                [-1.290033860743947, 50.701177092005445],
                                [-1.2898972820237875, 50.700299752493386],
                                [-1.2894930711182815, 50.6994561522166],
                                [-1.2888367779221104, 50.69867871537879],
                                [-1.287953637861848, 50.69799732162913],
                                [-1.286877600602456, 50.69743815813493],
                                [-1.2856500246201659, 50.69702271369701],
                                [-1.2843180878884957, 50.6967669534638],
                                [-1.2829329756997878, 50.696680705858284],
                                [-1.2755662437770827, 50.696680705858284],
                                [-1.27519545839354, 50.71590803611056],
                                [-1.2894833258490719, 50.71590803611056],
                                [-1.2894956279590897, 50.715893458488814],
                                [-1.2898995385227772, 50.71504999574592],
                                [-1.290035828968114, 50.71417284828849],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to sites of special scientific interest - <= 1.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.699068890642216],
                                [-1.3454941089722765, 50.69885711520889],
                                [-1.344108967038382, 50.69877084320827],
                                [-1.3208209636825061, 50.69877084320827],
                                [-1.3194358217486115, 50.69885711520889],
                                [-1.318103862935108, 50.69911289206394],
                                [-1.3168762713182098, 50.69952834510824],
                                [-1.315800223569636, 50.700087509506744],
                                [-1.3149170769012408, 50.70076889729073],
                                [-1.3142607798636532, 50.70154632257843],
                                [-1.3138565670145297, 50.70238990736972],
                                [-1.3137199876975005, 50.70326722936367],
                                [-1.3137183822199283, 50.713867310265414],
                                [-1.313854677283524, 50.71474447524425],
                                [-1.3142586013055353, 50.715587953476096],
                                [-1.3145287249450652, 50.71590803611056],
                                [-1.3465969302374958, 50.71590803611056],
                                [-1.3465969302374958, 50.699068890642216],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to built up areas - <= 1.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.322200857821111, 50.70536637042981],
                                [-1.322199366936169, 50.69551832651728],
                                [-1.322062812155532, 50.69464101068349],
                                [-1.3216586717770011, 50.69379743133277],
                                [-1.3210024921324883, 50.693020010097705],
                                [-1.320119502905801, 50.6923386244],
                                [-1.3190436461132735, 50.69177945967104],
                                [-1.3178162710418753, 50.69136400358872],
                                [-1.3164845453747596, 50.6911082208795],
                                [-1.3150996435064612, 50.69102194029476],
                                [-1.2934642755421166, 50.69102194029476],
                                [-1.2920793736738183, 50.6911082208795],
                                [-1.2907476480067026, 50.69136400358872],
                                [-1.2895202729353044, 50.69177945967104],
                                [-1.2884444161427768, 50.6923386244],
                                [-1.2875614269160895, 50.693020010097705],
                                [-1.286905247271577, 50.69379743133277],
                                [-1.2865011068930459, 50.69464101068349],
                                [-1.286364552112409, 50.69551832651728],
                                [-1.286363061227467, 50.70536637042981],
                                [-1.2864993335538402, 50.706243541569904],
                                [-1.2869031900296994, 50.707087025243496],
                                [-1.287559126126511, 50.7078644101992],
                                [-1.2884419476653997, 50.70854582353015],
                                [-1.2895177375559044, 50.70910507906579],
                                [-1.2907451585185419, 50.70952068421979],
                                [-1.2920770418063745, 50.70977666649969],
                                [-1.2934622008152197, 50.709863187813276],
                                [-1.3151017182333582, 50.709863187813276],
                                [-1.3164868772422034, 50.70977666649969],
                                [-1.3178187605300362, 50.70952068421979],
                                [-1.3190461814926735, 50.70910507906579],
                                [-1.3201219713831782, 50.70854582353015],
                                [-1.321004792922067, 50.7078644101992],
                                [-1.3216607290188784, 50.707087025243496],
                                [-1.322064585494738, 50.706243541569904],
                                [-1.322200857821111, 50.70536637042981],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'amber',
                        issue: 'Close to areas of outstanding natural beauty - <= 1.5km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3465969302374958, 50.68805808728612],
                                [-1.3174070150129187, 50.67844327950872],
                                [-1.3169764414482035, 50.678953577497694],
                                [-1.3165724373540153, 50.67979714879116],
                                [-1.316435928707519, 50.68067445549985],
                                [-1.3164342710341812, 50.691633130577124],
                                [-1.3165705063914672, 50.69251031084444],
                                [-1.3169742530573112, 50.69335380257869],
                                [-1.317630010386672, 50.69413119353862],
                                [-1.3185125905331647, 50.69481260996058],
                                [-1.319588084965816, 50.695371865007004],
                                [-1.3208151668905117, 50.69578746566083],
                                [-1.3221466796017973, 50.69604343926876],
                                [-1.3235314496676274, 50.696129947866375],
                                [-1.3427221028121035, 50.696129947866375],
                                [-1.3441068728779335, 50.69604343926876],
                                [-1.3454383855892191, 50.69578746566083],
                                [-1.3465969302374958, 50.695395077912615],
                                [-1.3465969302374958, 50.68805808728612],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Bad windspeed - < 4m/s or > 7.5m/s',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.33461711915146, 50.68411208127974],
                                [-1.3147572597099781, 50.67757048191068],
                                [-1.275870815939669, 50.680886907570596],
                                [-1.2757872910459838, 50.685218148192405],
                                [-1.33461711915146, 50.685218148192405],
                                [-1.33461711915146, 50.68411208127974],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Bad windspeed - < 4m/s or > 7.5m/s',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3010647701177902, 50.691902878625484],
                                [-1.2756583807758117, 50.691902878625484],
                                [-1.2753654345108338, 50.70709380802265],
                                [-1.3010647701177902, 50.70709380802265],
                                [-1.3010647701177902, 50.691902878625484],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to special areas of conservation - <= 1km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.28293431783257, 50.701177307578604],
                                [-1.275479530012268, 50.701177307578604],
                                [-1.275228916096492, 50.714173063987346],
                                [-1.28293431783257, 50.714173063987346],
                                [-1.28293431783257, 50.701177307578604],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to sites of special scientific interest - <= 1km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3441100836511737, 50.70326744495887],
                                [-1.3208198470697141, 50.70326744495887],
                                [-1.3208198470697141, 50.71386752595595],
                                [-1.3441100836511737, 50.71386752595595],
                                [-1.3441100836511737, 50.70326744495887],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to built up areas - <= 1km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3151006805906604, 50.69551854205466],
                                [-1.2934632384579174, 50.69551854205466],
                                [-1.2934632384579174, 50.70536658605337],
                                [-1.3151006805906604, 50.70536658605337],
                                [-1.3151006805906604, 50.69551854205466],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'red',
                        issue: 'Too close to areas of outstanding natural beauty - <= 1km',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.342721183047928, 50.68678146267331],
                                [-1.3241813705458192, 50.680674670924674],
                                [-1.3235323694318026, 50.680674670924674],
                                [-1.3235323694318026, 50.69163334609394],
                                [-1.342721183047928, 50.69163334609394],
                                [-1.342721183047928, 50.68678146267331],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Special area of conservation',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.281658414106687, 50.70186733241772],
                                [-1.2754662233742031, 50.70186733241772],
                                [-1.2752456584821532, 50.71330487610129],
                                [-1.281658414106687, 50.71330487610129],
                                [-1.281658414106687, 50.70186733241772],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Site of special scientific interest',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.343346457616093, 50.70376040412796],
                                [-1.3215116161465517, 50.70376040412796],
                                [-1.3215116161465517, 50.713289971134486],
                                [-1.343346457616093, 50.713289971134486],
                                [-1.343346457616093, 50.70376040412796],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Built up area',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.314421032212266, 50.69591132166596],
                                [-1.2943574317247055, 50.69591132166596],
                                [-1.2943574317247055, 50.70469119871362],
                                [-1.314421032212266, 50.70469119871362],
                                [-1.314421032212266, 50.69591132166596],
                            ],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {
                        suitability: 'darkRed',
                        issue: 'Area of outstanding natural beauty',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1.3419963357412428, 50.686542706669115],
                                [-1.3256082576397168, 50.68114467040985],
                                [-1.3241316461090378, 50.68114467040985],
                                [-1.3241316461090378, 50.691229841834996],
                                [-1.3419963357412428, 50.691229841834996],
                                [-1.3419963357412428, 50.686542706669115],
                            ],
                        ],
                    },
                },
            ],
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);

        const issues = result.features
            .map((feature) => feature.properties as GeoJsonProperties)
            .filter((properties) => properties?.suitability !== 'green');
        const issueDescriptions = new Set(issues.map((properties) => String(properties?.issue)));

        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(issueDescriptions.has('Close to special areas of conservation - <= 1.5km')).toBe(true);
        expect(issueDescriptions.has('Site of special scientific interest')).toBe(true);
        expect(issueDescriptions.has('Built up area')).toBe(true);
        expect(issueDescriptions.has('Area of outstanding natural beauty')).toBe(true);
        expect(issueDescriptions.has('Bad windspeed - < 4m/s or > 7.5m/s')).toBe(true);
        expect(issues.every((properties) => typeof properties?.sourceLayerId === 'string' && properties.sourceLayerId.length > 0)).toBe(true);
    });

    it('returns red matched polygons for low photovoltaic potential when only solar potential is analyzed', () => {
        const solarDataLayers: DataLayerDto[] = [
            {
                id: 'solarPotential',
                attributes: [
                    {
                        id: 'minPotential',
                        value: 900,
                    },
                ],
                analyze: true,
            },
        ];

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: solarDataLayers,
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);
        const redSolarPolygons = result.features.filter(
            (feature) =>
                (feature.properties as GeoJsonProperties)?.suitability === 'red' &&
                ((feature.properties as GeoJsonProperties)?.issue as string)?.includes('Low photovoltaic potential')
        );

        expect(dataProviderUtils.getSolarPotentialLayerData).toHaveBeenCalled();
        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(redSolarPolygons.length).toBeGreaterThan(0);
    });

    it('defaults to 900 kWh/kWp/year when minPotential is not provided', () => {
        const solarDataLayers: DataLayerDto[] = [
            {
                id: 'solarPotential',
                attributes: [],
                analyze: true,
            },
        ];

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: solarDataLayers,
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);
        const issues = result.features
            .map((feature) => (feature.properties as GeoJsonProperties)?.issue as string | undefined)
            .filter((issue): issue is string => Boolean(issue));

        expect(issues.some((issue) => issue.includes('Low photovoltaic potential - < 900 kWh/kWp/year'))).toBe(true);
    });

    it('returns red matched polygons for slopes above the maximum threshold', () => {
        const slopeDataLayers: DataLayerDto[] = [
            {
                id: 'slope',
                attributes: [
                    {
                        id: 'maxSlope',
                        value: 30,
                    },
                ],
                analyze: true,
            },
        ];

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: slopeDataLayers,
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);
        const steepSlopeIssues = result.features.filter(
            (feature) =>
                (feature.properties as GeoJsonProperties)?.suitability === 'red' &&
                ((feature.properties as GeoJsonProperties)?.issue as string)?.includes('Unfavourable solar terrain suitability - steep slope (> 30°)')
        );

        expect(dataProviderUtils.getSlopesLayerData).toHaveBeenCalled();
        expect(steepSlopeIssues.length).toBeGreaterThan(0);
    });


    it('flags polygons inside ancient woodland as an issue when the layer is analyzed', () => {
        const ancientWoodlandsDataLayers: DataLayerDto[] = [
            {
                id: 'ancientWoodlands',
                attributes: [],
                analyze: true,
            },
        ];

        const requestDto: AssetLocationRequestDto = {
            location: drawnLocation,
            dataLayers: ancientWoodlandsDataLayers,
        };

        const result: FeatureCollection<Geometry> = assetAnalysisService.analyzeLocation(requestDto);
        const ancientWoodlandIssues = result.features.filter(
            (feature) =>
                (feature.properties as GeoJsonProperties)?.suitability === 'darkRed' &&
                (feature.properties as GeoJsonProperties)?.issue === 'Ancient woodland'
        );

        expect(dataProviderUtils.getAncientWoodlandsLayerData).toHaveBeenCalled();
        expect(result.features.some((feature) => (feature.properties as GeoJsonProperties)?.suitability === 'green')).toBe(true);
        expect(ancientWoodlandIssues.length).toBeGreaterThan(0);
    });
});
