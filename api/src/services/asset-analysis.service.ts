// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { FeatureCollection, Feature, Polygon, MultiPolygon, GeoJsonProperties, Geometry } from 'geojson';
import { AssetLocationRequestDto } from '../models/asset-location-request.model';
import { DataProviderUtils } from '../utils/data-provider.utils';
import * as turf from '@turf/turf';
import { DataLayerDto } from '../models/data-layer.model';

/*
 * A service which provides access to analysis operations like location and suitability for different assets.
 */
export class AssetAnalysisService {
    constructor(private readonly dataProviderUtils: DataProviderUtils) {}

    private getAttributeValue(dataLayer: DataLayerDto, attributeId: string): number | string | undefined {
        return dataLayer.attributes.find((attribute) => attribute.id === attributeId)?.value;
    }

    private getNumericAttributeValue(dataLayer: DataLayerDto, attributeId: string, fallbackValue: number): number {
        const value = this.getAttributeValue(dataLayer, attributeId);

        return typeof value === 'number' && value >= 0 ? value : fallbackValue;
    }

    private getStringAttributeValue(dataLayer: DataLayerDto, attributeId: string, fallbackValue: string): string {
        const value = this.getAttributeValue(dataLayer, attributeId);

        return typeof value === 'string' && value.trim().length > 0 ? value : fallbackValue;
    }

    private getAgriculturalLandClassificationRank(classification: string): number {
        const ranking: Record<string, number> = {
            'Grade 1': 1,
            'Grade 2': 2,
            'Grade 3': 3,
            'Grade 4': 4,
            'Grade 5': 5,
        };

        return ranking[classification] ?? Number.POSITIVE_INFINITY;
    }

    /*
     * A helper method to get the polygons for the provided feature that have a buffer equivalent to the provided min distance in kilometers. If the min distance is > 1 then 2 polygons are returned one with a buffer of equal to the min distance and the other one with a buffer of min distance + 0.5. If the min distance is < 1 then 2 polygons are returned where the first one has no buffer applied and the second one has a buffer of 0.5 km.
     */
    private getBufferedPolygonsForFeature(feature: Feature<MultiPolygon>, minDistance: number): Feature<MultiPolygon | Polygon, GeoJsonProperties>[] {
        const bufferDistance = minDistance - 1;
        const bufferedFeature = minDistance > 1 ? turf.buffer(feature, bufferDistance, { units: 'kilometers' }) : feature;
        const bufferedFeature500M = turf.buffer(feature, minDistance > 1 ? bufferDistance + 0.5 : 0.5, { units: 'kilometers' });

        return [bufferedFeature!, bufferedFeature500M!];
    }

    /*
     * A helped method to get the matched polygons for the provided layer based on the provided location. The matched polygons are provided a the passed in suitability rating and the issue description.
     */
    private getMatchedPolygonsForLayer(
        layer: FeatureCollection<MultiPolygon | Polygon>,
        location: Feature<Polygon>,
        suitability: string,
        issue?: string
    ): Feature<Polygon | MultiPolygon, GeoJsonProperties>[] {
        const matchedPolygons: Feature<Polygon | MultiPolygon, GeoJsonProperties>[] = [];
        layer.features.forEach((layerFeature) => {
            if (layerFeature.geometry.type === 'MultiPolygon') {
                layerFeature.geometry.coordinates.forEach((position) => {
                    const polygon = turf.polygon(position);
                    const combinedFeatureCollection = { type: 'FeatureCollection', features: [location, polygon] } as FeatureCollection<Polygon>;
                    const intersection = turf.intersect(combinedFeatureCollection);

                    if (intersection) {
                        intersection.properties!.suitability = suitability;
                        if (issue) intersection.properties!.issue = issue;
                        matchedPolygons.push(intersection);
                    }
                });
            } else {
                const polygon = turf.polygon(layerFeature.geometry.coordinates);
                const combinedFeatureCollection = { type: 'FeatureCollection', features: [location, polygon] } as FeatureCollection<Polygon>;
                const intersection = turf.intersect(combinedFeatureCollection);

                if (intersection) {
                    intersection.properties!.suitability = suitability;
                    if (issue) intersection.properties!.issue = issue;
                    matchedPolygons.push(intersection);
                }
            }
        });

        return matchedPolygons;
    }

    /*
     * A helper method to get the matched polygons based on the data layers and location provided. These polygons are ordered with the good layer (suitability rating of green) -> caution layers (suitability rating of amber) -> bad layers (suitability of red) -> exact bad layers (suitability rating of darkRed)
     *
     * The good layer is a polygon with the dimensions of the provided location.
     * Caution layers are comprised of polygons where the minimum distance from a bad layer is 0.5 km.
     * Bad layers are comprised of polygons which envelope the polygons in the exact bad layer and account for the provided minimum distance attribute
     * Exact bad layers are comprised of polygons loaded from the specific data layers files.
     */
    private getMatchedPolygonsForLayers(dataLayers: DataLayerDto[], location: Feature<Polygon>): Feature<MultiPolygon | Polygon, GeoJsonProperties>[] {
        let cautionLayerMatchedPolygons: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];
        let badLayerMatchedPolygons: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];
        let exactbadLayerMatchedPolygons: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];

        const goodLayerMatchedPolygon: Feature<MultiPolygon | Polygon, GeoJsonProperties> = {
            ...location,
            properties: {
                suitability: 'green',
            },
        };
        dataLayers.forEach((dataLayer) => {
            if (dataLayer.id === 'windSpeed') {
                const minSpeed = this.getNumericAttributeValue(dataLayer, 'minSpeed', 4);
                const maxSpeed = this.getNumericAttributeValue(dataLayer, 'maxSpeed', 7.5);
                const windspeedLayer = this.dataProviderUtils.getWindspeedLayerData();
                const windspeedBadLayerData: FeatureCollection<MultiPolygon> = {
                    type: 'FeatureCollection',
                    features: windspeedLayer.features.filter(
                        (feature) => feature.properties!.ws_spring1 < minSpeed || feature.properties!.ws_spring1 > maxSpeed
                    ),
                };

                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(windspeedBadLayerData, location, 'red', `Bad windspeed - < ${minSpeed}m/s or > ${maxSpeed}m/s`)
                );
            } else if (dataLayer.id === 'solarPotential') {
                const minPotential = this.getNumericAttributeValue(dataLayer, 'minPotential', 900);
                const solarPotentialLayer = this.dataProviderUtils.getSolarPotentialLayerData();
                const solarPotentialBadLayerData: FeatureCollection<MultiPolygon> = {
                    type: 'FeatureCollection',
                    features: solarPotentialLayer.features.filter((feature) => {
                        const value = Number(feature.properties?.pv_annual_kwh_kwp);
                        return !Number.isFinite(value) || value < minPotential;
                    }),
                };

                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(
                        solarPotentialBadLayerData,
                        location,
                        'red',
                        `Low photovoltaic potential - < ${minPotential} kWh/kWp/year`
                    )
                );
            } else if (dataLayer.id === 'specialAreasOfConservation') {
                const minDistance = this.getNumericAttributeValue(dataLayer, 'minDistance', 1);
                const specialAreasOfConservationLayerData = this.dataProviderUtils.getSpecialAreasOfConservationLayerData();
                const specialAreasOfConservation1KmLayerData: FeatureCollection<MultiPolygon> =
                    this.dataProviderUtils.getSpecialAreasOfConservation1KmLayerData();
                const specialAreasOfConservationBufferedLayerFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];
                const specialAreasOfConservationBuffered500MLayerFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];

                specialAreasOfConservation1KmLayerData.features.forEach((feature) => {
                    const bufferedPolygons = this.getBufferedPolygonsForFeature(feature, minDistance);
                    specialAreasOfConservationBufferedLayerFeatures.push(bufferedPolygons[0]);
                    specialAreasOfConservationBuffered500MLayerFeatures.push(bufferedPolygons[1]);
                });

                const specialAreasOfConservationBufferedLayerData: FeatureCollection<MultiPolygon | Polygon, GeoJsonProperties> = {
                    type: 'FeatureCollection',
                    features: specialAreasOfConservationBufferedLayerFeatures,
                };
                const specialAreasOfConservationBuffered500MLayerData: FeatureCollection<MultiPolygon | Polygon, GeoJsonProperties> = {
                    type: 'FeatureCollection',
                    features: specialAreasOfConservationBuffered500MLayerFeatures,
                };

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(specialAreasOfConservationLayerData, location, 'darkRed', 'Special area of conservation')
                );
                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(
                        specialAreasOfConservationBufferedLayerData,
                        location,
                        'red',
                        `Too close to special areas of conservation - <= ${minDistance}km`
                    )
                );
                cautionLayerMatchedPolygons = cautionLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(
                        specialAreasOfConservationBuffered500MLayerData,
                        location,
                        'amber',
                        `Close to special areas of conservation - <= ${minDistance + 0.5}km`
                    )
                );
            } else if (dataLayer.id == 'sitesOfSpecialScientificInterest') {
                const minDistance = this.getNumericAttributeValue(dataLayer, 'minDistance', 1);
                const sitesOfSpecialScientificInterestLayerData = this.dataProviderUtils.getSitesOfSpecialScientificInterestLayerData();
                const sitesOfSpecialScientificInterest1KmLayerData = this.dataProviderUtils.getSitesOfSpecialScientificInterest1KmLayerData();
                const sitesOfSpecialScientificInterestBufferedFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];
                const sitesOfSpecialScientificInterestBuffered500MFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];

                sitesOfSpecialScientificInterest1KmLayerData.features.forEach((feature) => {
                    const bufferedPolygons = this.getBufferedPolygonsForFeature(feature, minDistance);
                    sitesOfSpecialScientificInterestBufferedFeatures.push(bufferedPolygons[0]);
                    sitesOfSpecialScientificInterestBuffered500MFeatures.push(bufferedPolygons[1]);
                });

                const sitesOfSpecialScientificInterestBufferLayerData: FeatureCollection<MultiPolygon | Polygon, GeoJsonProperties> = {
                    type: 'FeatureCollection',
                    features: sitesOfSpecialScientificInterestBufferedFeatures,
                };
                const sitesOfSpecialScientifiInterestBuffer500MLayerData: FeatureCollection<MultiPolygon | Polygon, GeoJsonProperties> = {
                    type: 'FeatureCollection',
                    features: sitesOfSpecialScientificInterestBuffered500MFeatures,
                };

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(sitesOfSpecialScientificInterestLayerData, location, 'darkRed', 'Site of special scientific interest')
                );
                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(
                        sitesOfSpecialScientificInterestBufferLayerData,
                        location,
                        'red',
                        `Too close to sites of special scientific interest - <= ${minDistance}km`
                    )
                );
                cautionLayerMatchedPolygons = cautionLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(
                        sitesOfSpecialScientifiInterestBuffer500MLayerData,
                        location,
                        'amber',
                        `Close to sites of special scientific interest - <= ${minDistance + 0.5}km`
                    )
                );
            } else if (dataLayer.id === 'builtUpAreas') {
                const minDistance = this.getNumericAttributeValue(dataLayer, 'minDistance', 1);
                const builtupAreasLayerData = this.dataProviderUtils.getBuiltupAreasLayerData();
                const builtupAreas1KmLayerData = this.dataProviderUtils.getBuiltupAreas1KmLayerData();
                const builtupAreasBufferedFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];
                const builtupAreasBuffered500MFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];

                builtupAreas1KmLayerData.features.forEach((feature) => {
                    const bufferedPolygons = this.getBufferedPolygonsForFeature(feature, minDistance);
                    builtupAreasBufferedFeatures.push(bufferedPolygons[0]);
                    builtupAreasBuffered500MFeatures.push(bufferedPolygons[1]);
                });

                const builtupAreasBufferLayerData: FeatureCollection<MultiPolygon | Polygon, GeoJsonProperties> = {
                    type: 'FeatureCollection',
                    features: builtupAreasBufferedFeatures,
                };
                const builtupAreasBuffer500MLayerData: FeatureCollection<MultiPolygon | Polygon, GeoJsonProperties> = {
                    type: 'FeatureCollection',
                    features: builtupAreasBuffered500MFeatures,
                };

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(builtupAreasLayerData, location, 'darkRed', 'Built up area')
                );
                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(builtupAreasBufferLayerData, location, 'red', `Too close to built up areas - <= ${minDistance}km`)
                );
                cautionLayerMatchedPolygons = cautionLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(builtupAreasBuffer500MLayerData, location, 'amber', `Close to built up areas - <= ${minDistance + 0.5}km`)
                );
            } else if (dataLayer.id == 'areasOfOutstandingNaturalBeauty') {
                const minDistance = this.getNumericAttributeValue(dataLayer, 'minDistance', 1);
                const areasOfNaturalBeautyLayerData = this.dataProviderUtils.getAreasOfNaturalBeautyLayerData();
                const areasOfNaturalBeauty1KmLayerData = this.dataProviderUtils.getAreasOfNaturalBeauty1KmLayerData();
                const areasOfNaturalBeautyBufferedFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];
                const areasOfNaturalBeautyBuffered500MFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];

                areasOfNaturalBeauty1KmLayerData.features.forEach((feature) => {
                    const bufferedPolygons = this.getBufferedPolygonsForFeature(feature, minDistance);
                    areasOfNaturalBeautyBufferedFeatures.push(bufferedPolygons[0]);
                    areasOfNaturalBeautyBuffered500MFeatures.push(bufferedPolygons[1]);
                });

                const areasOfNaturalBeautyBufferLayerData: FeatureCollection<MultiPolygon | Polygon, GeoJsonProperties> = {
                    type: 'FeatureCollection',
                    features: areasOfNaturalBeautyBufferedFeatures,
                };
                const areasOfNaturalBeautyBufferLayer500MData: FeatureCollection<MultiPolygon | Polygon, GeoJsonProperties> = {
                    type: 'FeatureCollection',
                    features: areasOfNaturalBeautyBuffered500MFeatures,
                };

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(areasOfNaturalBeautyLayerData, location, 'darkRed', `Area of outstanding natural beauty`)
                );
                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(
                        areasOfNaturalBeautyBufferLayerData,
                        location,
                        'red',
                        `Too close to areas of outstanding natural beauty - <= ${minDistance}km`
                    )
                );
                cautionLayerMatchedPolygons = cautionLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(
                        areasOfNaturalBeautyBufferLayer500MData,
                        location,
                        'amber',
                        `Close to areas of outstanding natural beauty - <= ${minDistance + 0.5}km`
                    )
                );
            } else if (dataLayer.id === 'agriculturalLandClassification') {
                const selectedClassification = this.getStringAttributeValue(dataLayer, 'classificationThreshold', 'Grade 3');
                const selectedClassificationRank = this.getAgriculturalLandClassificationRank(selectedClassification);
                const iowPalLayerData = this.dataProviderUtils.getIoWPalLayerData();

                const agriculturalLandClassificationAboveThresholdLayerData: FeatureCollection<MultiPolygon | Polygon> = {
                    type: 'FeatureCollection',
                    features: iowPalLayerData.features.filter((feature) => {
                        const classification = String(feature.properties?.ALC_GRADE || '');
                        const classificationRank = this.getAgriculturalLandClassificationRank(classification);

                        return classificationRank <= selectedClassificationRank;
                    }),
                };

                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(
                        agriculturalLandClassificationAboveThresholdLayerData,
                        location,
                        'red',
                        `Agricultural land classification at the selected grade (${selectedClassification}) and better`
                    )
                );
            } else if (dataLayer.id === 'fuelPoverty') {
                const fuelPovertyLayerData = this.dataProviderUtils.getFuelPovertyLayerData();
                const povertyPercentages = fuelPovertyLayerData.features
                    .map((feature) => Number(feature.properties?.percentageOfHousesInFuelPoverty))
                    .filter((value) => Number.isFinite(value));

                if (povertyPercentages.length > 0) {
                    const averageFuelPovertyPercentage =
                        povertyPercentages.reduce((sum, value) => sum + value, 0) / povertyPercentages.length;

                    const fuelPovertyBelowAverageLayerData: FeatureCollection<MultiPolygon | Polygon> = {
                        type: 'FeatureCollection',
                        features: fuelPovertyLayerData.features.filter((feature) => {
                            const value = Number(feature.properties?.percentageOfHousesInFuelPoverty);
                            return Number.isFinite(value) && value < averageFuelPovertyPercentage;
                        }),
                    };

                    badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                        this.getMatchedPolygonsForLayer(
                            fuelPovertyBelowAverageLayerData,
                            location,
                            'red',
                            'Low priority for minimising fuel poverty'
                        )
                    );
                }
            }
        });

        return [goodLayerMatchedPolygon, ...cautionLayerMatchedPolygons, ...badLayerMatchedPolygons, ...exactbadLayerMatchedPolygons];
    }
    /*
     * A method to analayze the location sent by the user along with the data layers they choose to include for analysis and return a number of polygons with a suitability rating for placing an asset.
     */
    public analyzeLocation(req: AssetLocationRequestDto): FeatureCollection<Geometry> {
        const locationPolygon = turf.polygon(req.location.features![0].geometry.coordinates);
        const dataLayersToBeAnalysed = req.dataLayers.filter((dataLayer) => dataLayer.analyze);

        const matchedPolygons = this.getMatchedPolygonsForLayers(dataLayersToBeAnalysed, locationPolygon);
        const featureCollection: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [...matchedPolygons],
        };

        return featureCollection;
    }
}
