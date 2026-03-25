// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import * as fs from 'fs';
import Fuse, { FuseResult } from 'fuse.js';
import { FeatureCollection, GeoJSON, Geometry, MultiPolygon, Polygon } from 'geojson';
import * as path from 'path';
import proj4 from 'proj4';
import { AssetsDTO } from '../models/asset.model';
import { LayersDTO } from '../models/layers.model';
import { LocationsDTO } from '../models/location.model';
import { SearchOptionDTO } from '../models/search.model';

proj4.defs(
    'EPSG:27700',
    '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs'
);

/**
 * Utility class for data providers
 */
export class DataProviderUtils {
    private readonly layersDataFilePath: string;
    private readonly assetsDataFilePath: string;
    private readonly sampleGeoJsonFilePath: string;
    private readonly substationsDataFilePath: string;
    private readonly gridSupplyPointDataFilePath: string;
    private readonly powerLineDataFilePath: string;
    private readonly regionsDataFilePath: string;
    private readonly windspeedLayerDataFilePath: string;
    private readonly solarPotentialLayerDataFilePath: string;
    private readonly specialAreasOfConservationLayerDataFilePath: string;
    private readonly specialAreasOfConservation1KmLayerDataFilePath: string;
    private readonly sitesOfSpecialScientificInterestLayerDataFilePath: string;
    private readonly sitesOfSpecialScientificInterest1KmLayerDataFilePath: string;
    private readonly builtupAreasLayerDataFilePath: string;
    private readonly builtupAreas1KmLayerDataFilePath: string;
    private readonly areasOfNaturalBeautyLayerDataFilePath: string;
    private readonly areasOfNaturalBeauty1KmLayerDataFilePath: string;
    private readonly roadBufferLayerDataFilePath: string;
    private readonly railBufferLayerDataFilePath: string;
    private readonly railBufferSolarLayerDataFilePath: string;
    private readonly roadBufferSolar7mLayerDataFilePath: string;
    private readonly roadBufferSolar5mLayerDataFilePath: string;
    private readonly aspectLayerDataFilePath: string;
    private readonly slopesLayerDataFilePath: string;
    private readonly iowPalLayerDataFilePath: string;
    private readonly fuelPovertyLayerDataFilePath: string;
    private readonly ancientWoodlandsLayerDataFilePath: string;
    private readonly scheduledAncientMonuments750mBufferLayerDataFilePath: string;
    private readonly specialProtectionAreas2kmBufferLayerDataFilePath: string;
    private readonly ramsarWetlandsLayerDataFilePath: string;
    private readonly coastalErosionProjectionLayerDataFilePath: string;
    private readonly dissolvedRiverFloodRiskLayerDataFilePath: string;
    private readonly agriculturalLandClassificationDataFilePath: string;
    private readonly solarKkDataFilePath: string;
    private fuse: Fuse<SearchOptionDTO> | undefined;
    private readonly cache = new Map<string, unknown>();

    /**
     * Constructor for DataProviderUtils
     */
    constructor() {
        this.regionsDataFilePath = path.join(__dirname, '../data/regions.json');
        this.layersDataFilePath = path.join(__dirname, '../data/layers.json');
        this.assetsDataFilePath = path.join(__dirname, '../data/assets.json');
        this.sampleGeoJsonFilePath = path.join(__dirname, '../data/sampleGeoJson.json');
        this.substationsDataFilePath = path.join(__dirname, '../data/substations.json');
        this.gridSupplyPointDataFilePath = path.join(__dirname, '../data/grid-supply-points.geojson');
        this.powerLineDataFilePath = path.join(__dirname, '../data/main-power-lines.geojson');
        this.windspeedLayerDataFilePath = path.join(__dirname, '../data/windspeed.geojson');
        this.solarPotentialLayerDataFilePath = path.join(__dirname, '../data/pvout.geojson');
        this.specialAreasOfConservationLayerDataFilePath = path.join(__dirname, '../data/sac.geojson');
        this.specialAreasOfConservation1KmLayerDataFilePath = path.join(__dirname, '../data/sac-1km.geojson');
        this.sitesOfSpecialScientificInterestLayerDataFilePath = path.join(__dirname, '../data/sssi.geojson');
        this.sitesOfSpecialScientificInterest1KmLayerDataFilePath = path.join(__dirname, '../data/sssi-1km.geojson');
        this.builtupAreasLayerDataFilePath = path.join(__dirname, '../data/bua.geojson');
        this.builtupAreas1KmLayerDataFilePath = path.join(__dirname, '../data/bua-1km.geojson');
        this.areasOfNaturalBeautyLayerDataFilePath = path.join(__dirname, '../data/areanb.geojson');
        this.areasOfNaturalBeauty1KmLayerDataFilePath = path.join(__dirname, '../data/areanb-1km.geojson');
        this.roadBufferLayerDataFilePath = path.join(__dirname, '../data/road_10m_buffer.geojson');
        this.railBufferLayerDataFilePath = path.join(__dirname, '../data/rail_10m_buffer.geojson');
        this.railBufferSolarLayerDataFilePath = path.join(__dirname, '../data/rail_5m_solar_buffer.geojson');
        this.roadBufferSolar7mLayerDataFilePath = path.join(__dirname, '../data/road_solar_7m_buffer.geojson');
        this.roadBufferSolar5mLayerDataFilePath = path.join(__dirname, '../data/road_solar_5m_buffer.geojson');
        this.aspectLayerDataFilePath = path.join(__dirname, '../data/Aspect_WGS84.geojson');
        this.slopesLayerDataFilePath = path.join(__dirname, '../data/Slopes_WGS84.geojson');
        this.iowPalLayerDataFilePath = path.join(__dirname, '../data/PAL_IOW_WGS84.geojson');
        this.fuelPovertyLayerDataFilePath = path.join(__dirname, '../data/Fuel_Poverty_WGS84.geojson');
        this.ancientWoodlandsLayerDataFilePath = path.join(__dirname, '../data/AncientWoodlands_IOW.geojson');
        this.scheduledAncientMonuments750mBufferLayerDataFilePath = path.join(__dirname, '../data/Scheduled_Ancient_Monuments_IoW.geojson');
        this.specialProtectionAreas2kmBufferLayerDataFilePath = path.join(__dirname, '../data/Special_protection_areas.geojson');
        this.ramsarWetlandsLayerDataFilePath = path.join(__dirname, '../data/ramsar_wetlands.geojson');
        this.coastalErosionProjectionLayerDataFilePath = path.join(__dirname, '../data/coastal_erosion_projection.geojson');
        this.dissolvedRiverFloodRiskLayerDataFilePath = path.join(__dirname, '../data/dissolved_river_200m_buffer.geojson');
        this.agriculturalLandClassificationDataFilePath = path.join(__dirname, '../data/IoW_PAL.geojson');
        this.solarKkDataFilePath = path.join(__dirname, '../data/solar-kk.json');
    }

    /**
     * Read and parse a JSON file once, then return the cached result for all subsequent calls.
     */
    private readCachedJsonFile<T>(filePath: string): T {
        if (!this.cache.has(filePath)) {
            this.cache.set(filePath, JSON.parse(fs.readFileSync(filePath, 'utf8')));
        }
        return this.cache.get(filePath) as T;
    }

    /**
     * Read layers data from the JSON file
     * @returns LayersDTO object containing the layers data
     */
    public readLayersData(): LayersDTO {
        const fileContent = fs.readFileSync(this.layersDataFilePath, 'utf8');
        const layersData = JSON.parse(fileContent) as LayersDTO;
        console.log('Layers data categories:', layersData.categories.map(c => ({ name: c.name, itemsCount: c.items.length })));
        console.log('Weather items:', layersData.categories.find(c => c.name === 'Weather')?.items.map(i => i.name));
        return layersData;
    }

    /**
     * Read assets data from the JSON file
     * @returns Array of Asset objects containing the assets data
     */
    public readAssetsData(): AssetsDTO {
        const fileContent = fs.readFileSync(this.assetsDataFilePath, 'utf8');
        return JSON.parse(fileContent) as AssetsDTO;
    }

    /**
     * Read sample GeoJSON data from the JSON file
     * @returns GeoJSON object containing the sample GeoJSON data
     */
    public readSampleGeoJsonData(): GeoJSON {
        const fileContent = fs.readFileSync(this.sampleGeoJsonFilePath, 'utf8');
        return JSON.parse(fileContent) as GeoJSON;
    }

    /**
     * Read substations data from the JSON file
     * @returns LocationsDTO array containing the substations data
     */
    public readSubstationsData(): LocationsDTO {
        const fileContent = fs.readFileSync(this.substationsDataFilePath, 'utf8');
        return JSON.parse(fileContent) as LocationsDTO;
    }

    /**
     * Read GSP data from the GeoJSON file
     * @returns GeoJSON object containing the GSP data
     */
    public readGridSupplyPointData(): FeatureCollection {
        return this.readCachedJsonFile<FeatureCollection>(this.gridSupplyPointDataFilePath);
    }

    /**
     * Read power line data from the GeoJSON file
     * @returns GeoJSON object containing the GSP data
     */
    public readPowerLineData(): FeatureCollection {
        const fileContent = fs.readFileSync(this.powerLineDataFilePath, 'utf8');
        return JSON.parse(fileContent) as FeatureCollection;
    }

    /**
     * Read regions data from the JSON file and stores into local fuse instance
     */
    private readRegionsData() {
        const fileContent = fs.readFileSync(this.regionsDataFilePath, 'utf8');
        const regions = JSON.parse(fileContent) as SearchOptionDTO[];

        this.fuse = new Fuse(regions, {
            keys: ['name'],
            threshold: 0.3,
            distance: 100,
        });
    }

    /**
     * @returns SearchOptionDTO array containing the matches relevant to the input string
     */
    public getSearchOptions(query: string): SearchOptionDTO[] {
        if (!this.fuse) {
            this.readRegionsData();
        }

        return (this.fuse?.search(query) ?? []).slice(0, 10).map((r: FuseResult<SearchOptionDTO>) => r.item);
    }

    private readGeoJsonLayerData<T extends Geometry>(filePath: string): FeatureCollection<T> {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const layerData = JSON.parse(fileContent) as FeatureCollection<T>;

        return this.normalizeToWgs84(layerData);
    }

    private normalizeToWgs84<T extends Geometry>(featureCollection: FeatureCollection<T>): FeatureCollection<T> {
        const sampleCoordinate = this.getFirstCoordinate(this.getGeometryCoordinates(featureCollection.features[0]?.geometry));

        if (!sampleCoordinate || this.isWgs84Coordinate(sampleCoordinate)) {
            return featureCollection;
        }

        return {
            ...featureCollection,
            features: featureCollection.features.map((feature) => ({
                ...feature,
                geometry: this.reprojectGeometry(feature.geometry),
            })),
        };
    }

    private getGeometryCoordinates(geometry: Geometry | undefined): unknown {
        if (!geometry || geometry.type === 'GeometryCollection') {
            return null;
        }

        return geometry.coordinates;
    }

    private getFirstCoordinate(coordinates: unknown): [number, number] | null {
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
            return null;
        }

        if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
            return [coordinates[0], coordinates[1]];
        }

        return this.getFirstCoordinate(coordinates[0]);
    }

    private isWgs84Coordinate([longitude, latitude]: [number, number]): boolean {
        return longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
    }

    private reprojectCoordinates(coordinates: unknown): unknown {
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
            return coordinates;
        }

        if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
            const [longitude, latitude] = proj4('EPSG:27700', 'EPSG:4326', [coordinates[0], coordinates[1]]);
            return [longitude, latitude, ...coordinates.slice(2)];
        }

        return coordinates.map((coordinate) => this.reprojectCoordinates(coordinate));
    }

    private reprojectGeometry<T extends Geometry>(geometry: T): T {
        if (geometry.type === 'GeometryCollection') {
            return {
                ...geometry,
                geometries: geometry.geometries.map((childGeometry) => this.reprojectGeometry(childGeometry)),
            } as T;
        }

        return {
            ...geometry,
            coordinates: this.reprojectCoordinates(geometry.coordinates),
        } as T;
    }


    public getRoadBufferLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.roadBufferLayerDataFilePath);
    }

    public getRailBufferLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.railBufferLayerDataFilePath);
    }

    public getRailBufferSolarLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.railBufferSolarLayerDataFilePath);
    }

    public getRoadBufferSolar7mLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.roadBufferSolar7mLayerDataFilePath);
    }

    public getRoadBufferSolar5mLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.roadBufferSolar5mLayerDataFilePath);
    }


    public getWindspeedLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.windspeedLayerDataFilePath);
    }

    public getSolarPotentialLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.solarPotentialLayerDataFilePath);
    }

    public getSpecialAreasOfConservationLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.specialAreasOfConservationLayerDataFilePath);
    }

    public getSpecialAreasOfConservation1KmLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.specialAreasOfConservation1KmLayerDataFilePath);
    }

    public getSitesOfSpecialScientificInterestLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.sitesOfSpecialScientificInterestLayerDataFilePath);
    }

    public getSitesOfSpecialScientificInterest1KmLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.sitesOfSpecialScientificInterest1KmLayerDataFilePath);
    }

    public getBuiltupAreasLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.builtupAreasLayerDataFilePath);
    }

    public getBuiltupAreas1KmLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.builtupAreas1KmLayerDataFilePath);
    }

    public getAreasOfNaturalBeautyLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.areasOfNaturalBeautyLayerDataFilePath);
    }

    public getAreasOfNaturalBeauty1KmLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.areasOfNaturalBeauty1KmLayerDataFilePath);
    }

    public getAspectLayerData(): FeatureCollection<MultiPolygon | Polygon> {
        const fileContent = fs.readFileSync(this.aspectLayerDataFilePath, 'utf8');
        return JSON.parse(fileContent) as FeatureCollection<MultiPolygon | Polygon>;
    }
    public getIoWPalLayerData(): FeatureCollection<MultiPolygon | Polygon> {
        const fileContent = fs.readFileSync(this.iowPalLayerDataFilePath, 'utf8');

        return JSON.parse(fileContent) as FeatureCollection<MultiPolygon | Polygon>;
    }

    public getSlopesLayerData(): FeatureCollection<MultiPolygon | Polygon> {
        const fileContent = fs.readFileSync(this.slopesLayerDataFilePath, 'utf8');

        return JSON.parse(fileContent) as FeatureCollection<MultiPolygon | Polygon>;
    }
    public getFuelPovertyLayerData(): FeatureCollection<MultiPolygon | Polygon> {
        const fileContent = fs.readFileSync(this.fuelPovertyLayerDataFilePath, 'utf8');

        return JSON.parse(fileContent) as FeatureCollection<MultiPolygon | Polygon>;
    }

    public getAncientWoodlandsLayerData(): FeatureCollection<MultiPolygon | Polygon> {
        const fileContent = fs.readFileSync(this.ancientWoodlandsLayerDataFilePath, 'utf8');

        return JSON.parse(fileContent) as FeatureCollection<MultiPolygon | Polygon>;
    }

    public getScheduledAncientMonuments750mBufferLayerData(): FeatureCollection<MultiPolygon | Polygon> {
        const fileContent = fs.readFileSync(this.scheduledAncientMonuments750mBufferLayerDataFilePath, 'utf8');

        return JSON.parse(fileContent) as FeatureCollection<MultiPolygon | Polygon>;
    }

    public getSpecialProtectionAreas2kmBufferLayerData(): FeatureCollection<MultiPolygon | Polygon> {
        const fileContent = fs.readFileSync(this.specialProtectionAreas2kmBufferLayerDataFilePath, 'utf8');

        return JSON.parse(fileContent) as FeatureCollection<MultiPolygon | Polygon>;
    }

    public getRamsarWetlandsLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.ramsarWetlandsLayerDataFilePath);
    }

    public getCoastalErosionProjectionLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.coastalErosionProjectionLayerDataFilePath);
    }

    public getDissolvedRiverFloodRiskLayerData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.dissolvedRiverFloodRiskLayerDataFilePath);
    }

    public getAgriculturalLandClassificationData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.agriculturalLandClassificationDataFilePath);
    }

    public getSolarKkData(): { cardinal: Record<string, number>; degrees: Record<string, number> } {
        return this.readCachedJsonFile<{ cardinal: Record<string, number>; degrees: Record<string, number> }>(this.solarKkDataFilePath);
    }

    public getSolarOrientationOptions(): string[] {
        return Object.keys(this.getSolarKkData().cardinal);
    }
}

export const dataProviderUtils = new DataProviderUtils();
