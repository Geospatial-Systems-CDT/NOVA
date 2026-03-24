// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import * as fs from 'fs';
import Fuse, { FuseResult } from 'fuse.js';
import { FeatureCollection, GeoJSON, MultiPolygon, Polygon } from 'geojson';
import * as path from 'path';
import { AssetsDTO } from '../models/asset.model';
import { LayersDTO } from '../models/layers.model';
import { LocationsDTO } from '../models/location.model';
import { SearchOptionDTO } from '../models/search.model';

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
    private readonly aspectLayerDataFilePath: string;
    private readonly slopesLayerDataFilePath: string;
    private readonly iowPalLayerDataFilePath: string;
    private readonly fuelPovertyLayerDataFilePath: string;
    private readonly ancientWoodlandsLayerDataFilePath: string;
    private readonly agriculturalLandClassificationDataFilePath: string;
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
        this.aspectLayerDataFilePath = path.join(__dirname, '../data/Aspect_WGS84.geojson');
        this.slopesLayerDataFilePath = path.join(__dirname, '../data/Slopes_WGS84.geojson');
        this.iowPalLayerDataFilePath = path.join(__dirname, '../data/PAL_IOW_WGS84.geojson');
        this.fuelPovertyLayerDataFilePath = path.join(__dirname, '../data/Fuel_Poverty_WGS84.geojson');
        this.ancientWoodlandsLayerDataFilePath = path.join(__dirname, '../data/AncientWoodlands_IOW.geojson');
        this.agriculturalLandClassificationDataFilePath = path.join(__dirname, '../data/IoW_PAL.geojson');
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
    public getAgriculturalLandClassificationData(): FeatureCollection<MultiPolygon> {
        return this.readCachedJsonFile<FeatureCollection<MultiPolygon>>(this.agriculturalLandClassificationDataFilePath);
    }
}

export const dataProviderUtils = new DataProviderUtils();
