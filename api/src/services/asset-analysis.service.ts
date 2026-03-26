// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { FeatureCollection, Feature, Polygon, MultiPolygon, GeoJsonProperties, Geometry, BBox } from 'geojson';
import { AssetLocationRequestDto } from '../models/asset-location-request.model';
import { DataProviderUtils } from '../utils/data-provider.utils';
import * as turf from '@turf/turf';
import { DataLayerDto } from '../models/data-layer.model';
import { performance } from 'perf_hooks';

/*
 * A service which provides access to analysis operations like location and suitability for different assets.
 */
export class AssetAnalysisService {
    constructor(private readonly dataProviderUtils: DataProviderUtils) {}

    private getNumericProperty(properties: GeoJsonProperties | null | undefined, candidates: string[]): number | null {
        if (!properties) return null;

        for (const candidate of candidates) {
            const value = Number(properties[candidate]);
            if (Number.isFinite(value)) return value;
        }

        return null;
    }
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

    /** Returns true when two [west,south,east,north] bounding boxes overlap. */
    private static bboxesOverlap(a: BBox, b: BBox): boolean {
        return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
    }

    /** Expands a bbox outward by `km` in all directions (uses 1° ≈ 111 km). */
    private static expandBbox(bbox: BBox, km: number): BBox {
        const delta = km / 111;
        return [bbox[0] - delta, bbox[1] - delta, bbox[2] + delta, bbox[3] + delta];
    }

    /*
     * A helper method to get the polygons for the provided feature that have a buffer equivalent to the provided min distance in kilometers.
     * Returns two disjoint zones:
     *   [0] inner (bad)    - the full disc up to minDistance (or the raw 1km pre-buffer when minDistance <= 1)
     *   [1] outer (caution) - an annulus from minDistance to minDistance+0.5km (inner disc subtracted out)
     * The annulus ensures the two zones do not overlap, which allows the report service to produce
     * single-issue candidate regions for each zone independently.
     */
    private getBufferedPolygonsForFeature(feature: Feature<MultiPolygon>, minDistance: number): Feature<MultiPolygon | Polygon, GeoJsonProperties>[] {
        const bufferDistance = minDistance - 1;
        const bufferedFeature = minDistance > 1 ? turf.buffer(feature, bufferDistance, { units: 'kilometers' }) : feature;
        const bufferedFeature500M = turf.buffer(feature, minDistance > 1 ? bufferDistance + 0.5 : 0.5, { units: 'kilometers' });

        // Subtract the inner buffer from the outer to produce a non-overlapping annulus.
        const annulus = turf.difference(turf.featureCollection([bufferedFeature500M!, bufferedFeature!]));

        return [bufferedFeature!, annulus ?? bufferedFeature500M!];
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
        const locationBbox = turf.bbox(location);
        layer.features.forEach((layerFeature) => {
            // Feature-level bbox check – skips features that cannot possibly intersect
            if (!AssetAnalysisService.bboxesOverlap(locationBbox, turf.bbox(layerFeature))) return;

            if (layerFeature.geometry.type === 'MultiPolygon') {
                layerFeature.geometry.coordinates.forEach((position) => {
                    // Per-polygon bbox check within the MultiPolygon
                    const outerRing = position[0];
                    let minLng = Infinity,
                        minLat = Infinity,
                        maxLng = -Infinity,
                        maxLat = -Infinity;
                    for (const c of outerRing) {
                        if (c[0] < minLng) minLng = c[0];
                        if (c[0] > maxLng) maxLng = c[0];
                        if (c[1] < minLat) minLat = c[1];
                        if (c[1] > maxLat) maxLat = c[1];
                    }
                    if (!AssetAnalysisService.bboxesOverlap(locationBbox, [minLng, minLat, maxLng, maxLat])) return;

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

    private getMatchedPolygonsForLayerCompact(
        layer: FeatureCollection<MultiPolygon | Polygon>,
        location: Feature<Polygon>,
        suitability: string,
        issue?: string
    ): Feature<Polygon | MultiPolygon, GeoJsonProperties>[] {
        const matchedPolygons: Feature<Polygon | MultiPolygon, GeoJsonProperties>[] = [];
        const locationBbox = turf.bbox(location);

        layer.features.forEach((layerFeature) => {
            if (!AssetAnalysisService.bboxesOverlap(locationBbox, turf.bbox(layerFeature))) return;

            const combinedFeatureCollection = {
                type: 'FeatureCollection',
                features: [location, layerFeature],
            } as FeatureCollection<Polygon | MultiPolygon>;

            const intersection = turf.intersect(combinedFeatureCollection);

            if (intersection) {
                intersection.properties!.suitability = suitability;
                if (issue) intersection.properties!.issue = issue;
                matchedPolygons.push(intersection);
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
        const locationBbox = turf.bbox(location);
        dataLayers.forEach((dataLayer) => {
            const _tLayer = performance.now();
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
                    this.getMatchedPolygonsForLayer(solarPotentialBadLayerData, location, 'red', `Low photovoltaic potential - < ${minPotential} kWh/kWp/year`)
                );
            } else if (dataLayer.id === 'slope' || dataLayer.id === 'slopeWind') {
                const defaultMaxSlope = dataLayer.id === 'slopeWind' ? 5.71 : 14.275;
                const maxSlope =
                    dataLayer.attributes.filter((attribute) => Number(attribute.value) >= 0).find((attribute) => attribute.id === 'maxSlope')?.value ||
                    defaultMaxSlope;
                const slopesLayer = this.dataProviderUtils.getSlopesLayerData();
                const slopesBadLayerData: FeatureCollection<MultiPolygon | Polygon> = {
                    type: 'FeatureCollection',
                    features: slopesLayer.features.filter((feature) => {
                        const slope = Number(this.getNumericProperty(feature.properties, ['Slope', 'slope']));
                        return !isNaN(slope) && slope > Number(maxSlope);
                    }),
                };

                const slopeIssue =
                    dataLayer.id === 'slopeWind'
                        ? `Unfavourable wind terrain suitability - steep slope (> ${maxSlope}°)`
                        : `Unfavourable solar terrain suitability - steep slope (> ${maxSlope}°)`;

                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(this.getMatchedPolygonsForLayer(slopesBadLayerData, location, 'red', slopeIssue));
            } else if (dataLayer.id === 'roadBuffer') {
                const roadBufferLayerData = this.dataProviderUtils.getRoadBufferLayerData();

                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(roadBufferLayerData, location, 'red', 'Too close to road (Wind Turbines)')
                );
            } else if (dataLayer.id === 'roadBufferSolar') {
                const roadBufferSolar7mLayerData = this.dataProviderUtils.getRoadBufferSolar7mLayerData();
                const roadBufferSolar5mLayerData = this.dataProviderUtils.getRoadBufferSolar5mLayerData();

                cautionLayerMatchedPolygons = cautionLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(roadBufferSolar7mLayerData, location, 'amber', '>7m to road')
                );
                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(roadBufferSolar5mLayerData, location, 'red', 'Too close to road (Solar)')
                );
            } else if (dataLayer.id === 'railBuffer') {
                const railBufferLayerData = this.dataProviderUtils.getRailBufferLayerData();

                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(railBufferLayerData, location, 'red', 'Too close to railway - <= 100m')
                );
            } else if (dataLayer.id === 'railBufferSolar') {
                const railBufferSolarLayerData = this.dataProviderUtils.getRailBufferSolarLayerData();

                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(railBufferSolarLayerData, location, 'red', 'Too close to railway (Solar)')
                );
            } else if (dataLayer.id === 'aspect') {
                const aspectLayer = this.dataProviderUtils.getAspectLayerData();
                const amberAspect = new Set([3, 7]);
                const redAspect = new Set([1, 2, 8]);
                const amberAspectIssue = 'Moderate solar terrain suitability - east/west-facing aspect';
                const redAspectIssue = 'Unfavourable solar terrain suitability - north-facing aspect';

                const aspectAmberLayerData: FeatureCollection<MultiPolygon | Polygon> = {
                    type: 'FeatureCollection',
                    features: aspectLayer.features.filter((feature) => {
                        const aspect = this.getNumericProperty(feature.properties, ['aspect', 'Aspect']);
                        return aspect !== null && amberAspect.has(Math.round(aspect));
                    }),
                };

                const aspectRedLayerData: FeatureCollection<MultiPolygon | Polygon> = {
                    type: 'FeatureCollection',
                    features: aspectLayer.features.filter((feature) => {
                        const aspect = this.getNumericProperty(feature.properties, ['aspect', 'Aspect']);
                        return aspect !== null && redAspect.has(Math.round(aspect));
                    }),
                };

                cautionLayerMatchedPolygons = cautionLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(aspectAmberLayerData, location, 'amber', amberAspectIssue)
                );
                badLayerMatchedPolygons = badLayerMatchedPolygons.concat(this.getMatchedPolygonsForLayer(aspectRedLayerData, location, 'red', redAspectIssue));
            } else if (dataLayer.id === 'specialAreasOfConservation') {
                const minDistance = this.getNumericAttributeValue(dataLayer, 'minDistance', 1);
                const specialAreasOfConservationLayerData = this.dataProviderUtils.getSpecialAreasOfConservationLayerData();
                const specialAreasOfConservation1KmLayerData: FeatureCollection<MultiPolygon> =
                    this.dataProviderUtils.getSpecialAreasOfConservation1KmLayerData();
                const specialAreasOfConservationBufferedLayerFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];
                const specialAreasOfConservationBuffered500MLayerFeatures: Feature<MultiPolygon | Polygon, GeoJsonProperties>[] = [];

                const sacExpandedBbox = AssetAnalysisService.expandBbox(locationBbox, minDistance + 0.5);
                specialAreasOfConservation1KmLayerData.features.forEach((feature) => {
                    if (!AssetAnalysisService.bboxesOverlap(sacExpandedBbox, turf.bbox(feature))) return;
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

                const sssiExpandedBbox = AssetAnalysisService.expandBbox(locationBbox, minDistance + 0.5);
                sitesOfSpecialScientificInterest1KmLayerData.features.forEach((feature) => {
                    if (!AssetAnalysisService.bboxesOverlap(sssiExpandedBbox, turf.bbox(feature))) return;
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

                const buaExpandedBbox = AssetAnalysisService.expandBbox(locationBbox, minDistance + 0.5);
                builtupAreas1KmLayerData.features.forEach((feature) => {
                    if (!AssetAnalysisService.bboxesOverlap(buaExpandedBbox, turf.bbox(feature))) return;
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

                const aonbExpandedBbox = AssetAnalysisService.expandBbox(locationBbox, minDistance + 0.5);
                areasOfNaturalBeauty1KmLayerData.features.forEach((feature) => {
                    if (!AssetAnalysisService.bboxesOverlap(aonbExpandedBbox, turf.bbox(feature))) return;
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
            } else if (dataLayer.id === 'ancientWoodlands') {
                const ancientWoodlandsLayerData = this.dataProviderUtils.getAncientWoodlandsLayerData();

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(ancientWoodlandsLayerData, location, 'darkRed', 'Ancient woodland')
                );
            } else if (dataLayer.id === 'scheduledAncientMonuments750mBuffer') {
                const scheduledAncientMonumentsLayerData = this.dataProviderUtils.getScheduledAncientMonuments750mBufferLayerData();

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(scheduledAncientMonumentsLayerData, location, 'darkRed', 'Scheduled Ancient Monuments-750m Buffer')
                );
            } else if (dataLayer.id === 'specialProtectionAreas2kmBuffer') {
                const specialProtectionAreasLayerData = this.dataProviderUtils.getSpecialProtectionAreas2kmBufferLayerData();

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(specialProtectionAreasLayerData, location, 'darkRed', 'Special Protection Areas (2km buffer)')
                );
            } else if (dataLayer.id === 'ramsarWetlands') {
                const ramsarWetlandsLayerData = this.dataProviderUtils.getRamsarWetlandsLayerData();

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(ramsarWetlandsLayerData, location, 'darkRed', 'Ramsar Wetland')
                );
            } else if (dataLayer.id === 'coastalErosionProjection') {
                const coastalErosionProjectionLayerData = this.dataProviderUtils.getCoastalErosionProjectionLayerData();

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(coastalErosionProjectionLayerData, location, 'darkRed', 'Coastal Erosion')
                );
            } else if (dataLayer.id === 'dissolvedRiverFloodRisk') {
                const dissolvedRiverFloodRiskLayerData = this.dataProviderUtils.getDissolvedRiverFloodRiskLayerData();

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayer(dissolvedRiverFloodRiskLayerData, location, 'darkRed', 'Flood risk within 200m of river')
                );
            } else if (dataLayer.id === 'fuelPoverty') {
                const fuelPovertyLayerData = this.dataProviderUtils.getFuelPovertyLayerData();
                const povertyPercentages = fuelPovertyLayerData.features
                    .map((feature) => Number(feature.properties?.percentageOfHousesInFuelPoverty))
                    .filter((value) => Number.isFinite(value));

                if (povertyPercentages.length > 0) {
                    const averageFuelPovertyPercentage = povertyPercentages.reduce((sum, value) => sum + value, 0) / povertyPercentages.length;

                    const fuelPovertyBelowAverageLayerData: FeatureCollection<MultiPolygon | Polygon> = {
                        type: 'FeatureCollection',
                        features: fuelPovertyLayerData.features.filter((feature) => {
                            const value = Number(feature.properties?.percentageOfHousesInFuelPoverty);
                            return Number.isFinite(value) && value < averageFuelPovertyPercentage;
                        }),
                    };

                    badLayerMatchedPolygons = badLayerMatchedPolygons.concat(
                        this.getMatchedPolygonsForLayer(fuelPovertyBelowAverageLayerData, location, 'red', 'Low priority for minimising fuel poverty')
                    );
                }
            } else if (dataLayer.id === 'unsuitableLand') {
                const unsuitableLandLayerData = this.dataProviderUtils.getUnsuitableLandLayerData();

                exactbadLayerMatchedPolygons = exactbadLayerMatchedPolygons.concat(
                    this.getMatchedPolygonsForLayerCompact(unsuitableLandLayerData, location, 'darkRed', 'Unsuitable land')
                );
            }
            console.debug(`[getMatchedPolygonsForLayers] layer "${dataLayer.id}": ${(performance.now() - _tLayer).toFixed(1)}ms`);
        });

        return [goodLayerMatchedPolygon, ...cautionLayerMatchedPolygons, ...badLayerMatchedPolygons, ...exactbadLayerMatchedPolygons];
    }
    /*
     * A method to analayze the location sent by the user along with the data layers they choose to include for analysis and return a number of polygons with a suitability rating for placing an asset.
     */
    public analyzeLocation(req: AssetLocationRequestDto): FeatureCollection<Geometry> {
        const _t0 = performance.now();
        const locationPolygon = turf.polygon(req.location.features![0].geometry.coordinates);
        const dataLayersToBeAnalysed = req.dataLayers.filter((dataLayer) => dataLayer.analyze);
        console.debug(`[analyzeLocation] ${dataLayersToBeAnalysed.length} layer(s) to process: ${dataLayersToBeAnalysed.map((l) => l.id).join(', ')}`);

        const _tLayers = performance.now();
        const matchedPolygons = this.getMatchedPolygonsForLayers(dataLayersToBeAnalysed, locationPolygon);
        console.debug(`[analyzeLocation] getMatchedPolygonsForLayers (${matchedPolygons.length} polygons): ${(performance.now() - _tLayers).toFixed(1)}ms`);

        const featureCollection: FeatureCollection<Geometry> = {
            type: 'FeatureCollection',
            features: [...matchedPolygons],
        };

        console.debug(`[analyzeLocation] total: ${(performance.now() - _t0).toFixed(1)}ms`);
        return featureCollection;
    }
}
