// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Feature, FeatureCollection, GeoJsonProperties, Geometry, MultiPolygon, Point, Polygon } from 'geojson';
import * as turf from '@turf/turf';
import { performance } from 'perf_hooks';
import { ReportAssumptionDTO, ReportDTO, ReportIssueDTO, ReportRegionDTO, ReportRegionEnergyPotentialDTO, ReportRegionLayerValueDTO } from '../models/report.model';
import { DataLayerDto } from '../models/data-layer.model';
import { DataProviderUtils } from '../utils/data-provider.utils';

/** Minimum area in m² below which a region is discarded as a geometric sliver (0.01 km²) */
const MIN_AREA_M2 = 10000;
const HOURS_PER_YEAR = 8760;
const HOURS_PER_SEASON = HOURS_PER_YEAR / 4;
const SOLAR_SHADING_FACTOR = 1.0;
const SOLAR_ORIENTATION_SOUTH = 'south';
const SOLAR_DENSITY_MW_PER_KM2 = 40;
const DEFAULT_SOLAR_KK = 1023;
const DEFAULT_SOLAR_ASSET_CAPACITY_MW = 1;
const DEFAULT_WIND_CAPACITY_FACTOR = 0.34;
const WIND_SPACING_DOWNWIND_DIAMETERS = 7;
const WIND_SPACING_CROSSWIND_DIAMETERS = 4;
const WIND_SINGLE_TURBINE_MIN_RADIUS_M = 300;

const DEFAULT_WIND_MODEL = {
    capacityMW: 4.3,
    rotorDiameterM: 120,
    powerCoefficient: 0.45,
    airDensityKgPerM3: 1.225,
    cutInSpeedMs: 3,
    cutOutSpeedMs: 25,
};

type SeasonalWindspeed = {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
};

type WindModel = {
    capacityMW: number;
    rotorDiameterM: number;
    powerCoefficient: number;
    airDensityKgPerM3: number;
    cutInSpeedMs: number;
    cutOutSpeedMs: number;
};

const roundTo = (value: number, decimals: number): number => {
    const p = 10 ** decimals;
    return Math.round(value * p) / p;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const parseFirstNumber = (raw: unknown): number | null => {
    if (raw === null || raw === undefined) return null;
    const text = String(raw);
    const match = text.match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    const parsed = Number.parseFloat(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
};

const parsePowerToMW = (rawValue: unknown): number | null => {
    if (rawValue === null || rawValue === undefined) return null;
    const text = String(rawValue);
    const n = parseFirstNumber(text);
    if (n === null) return null;

    const normalized = text.toLowerCase();
    if (normalized.includes('gw')) return n * 1000;
    if (normalized.includes('mw')) return n;
    if (normalized.includes('kw')) return n / 1000;
    if (normalized.includes('wp') || normalized.includes(' w')) return n / 1_000_000;
    return null;
};

interface IssueUnion {
    description: string;
    suitability: string;
    union: Feature<Polygon | MultiPolygon, GeoJsonProperties>;
}

/**
 * Service which post-processes a FeatureCollection (the output of AssetAnalysisService.analyzeLocation)
 * into a suitability report of candidate regions grouped by issue count.
 */
export class ReportService {
    constructor(private readonly dataProviderUtils?: DataProviderUtils) {}

    /**
     * Generate a report from an already-computed analysis FeatureCollection.
     *
     * @param analysisResult - The FeatureCollection returned by AssetAnalysisService.analyzeLocation.
     * @param maxIssues - Include regions with at most this many distinct issue types.
     * @param dataLayers - All data layers submitted in the analysis request (both analyzed and non-analyzed).
     *                     Used to derive `assumptions` and `layerValues` for analyze=true layers only.
     * @param selectedPolygon - The polygon drawn by the user, or null.
     */
    public generateReport(
        analysisResult: FeatureCollection<Geometry>,
        maxIssues: number,
        dataLayers: DataLayerDto[] = [],
        selectedPolygon: Feature<Polygon> | null = null
    ): ReportDTO {
        const activeDataLayers = dataLayers.filter((l) => l.analyze);
        const assumptions = this.buildAssumptions(activeDataLayers);
        const _t0 = performance.now();

        // 1. Separate green baseline from issue features
        let greenFeature = analysisResult.features.find((f) => f.properties?.suitability === 'green') as
            | Feature<Polygon | MultiPolygon, GeoJsonProperties>
            | undefined;

        if (!greenFeature) {
            return { regions: [], totalRegions: 0, selectedPolygon, assumptions };
        }

        // 1a. Clip the green baseline to the IoW coastline so that all downstream
        //     candidate geometries are automatically land-only. Doing this once here
        //     is far cheaper than intersecting every candidate region individually.
        if (this.dataProviderUtils) {
            const _tCoastline = performance.now();
            const coastlineFeatures = this.dataProviderUtils.getCoastlineData().features as Feature<Polygon | MultiPolygon, GeoJsonProperties>[];
            const coastlineGeometry = this.mergeGeometryFeatures(coastlineFeatures);
            if (coastlineGeometry) {
                const clipped = turf.intersect(turf.featureCollection([greenFeature, coastlineGeometry]));
                if (!clipped) {
                    return { regions: [], totalRegions: 0, selectedPolygon, assumptions };
                }
                greenFeature = clipped as Feature<Polygon | MultiPolygon, GeoJsonProperties>;
            }
            console.debug(`[generateReport] coastline clip: ${(performance.now() - _tCoastline).toFixed(1)}ms`);
        }

        const issueFeatures = analysisResult.features.filter((f) => f.properties?.suitability !== 'green') as Feature<
            Polygon | MultiPolygon,
            GeoJsonProperties
        >[];

        // 1b. Apply unsuitable-land mask once to the green baseline.
        // We avoid including this highly detailed layer in combinatorial issue splitting,
        // but still enforce it as a hard exclusion from candidate report regions.
        const unsuitableLandFeatures = issueFeatures.filter((f) => String(f.properties?.issue ?? '') === 'Unsuitable land');
        if (unsuitableLandFeatures.length > 0) {
            const unsuitableLandGeometry = this.mergeGeometryFeatures(unsuitableLandFeatures);
            if (unsuitableLandGeometry && this.bboxesOverlap(turf.bbox(greenFeature), turf.bbox(unsuitableLandGeometry))) {
                const maskedGreen = turf.difference(turf.featureCollection([greenFeature, unsuitableLandGeometry]));
                if (!maskedGreen) {
                    return { regions: [], totalRegions: 0, selectedPolygon, assumptions };
                }
                greenFeature = maskedGreen as Feature<Polygon | MultiPolygon, GeoJsonProperties>;
            }
        }

        // 2. Build one unioned polygon per distinct issue description
        const _tUnions = performance.now();
        const issueUnions = this.buildIssueUnions(issueFeatures);
        console.debug(`[generateReport] buildIssueUnions (${issueUnions.length} distinct issues): ${(performance.now() - _tUnions).toFixed(1)}ms`);

        // 3. Enumerate exact-k combinations and build one candidate region per combination.
        //    Each combination produces a geometry that has EXACTLY those issues and no others,
        //    so flattened sub-polygons are naturally bounded by issue edges.
        const regions: ReportRegionDTO[] = [];
        let regionIndex = 1;
        let _tLayerValuesTotal = 0;

        const _tCombos = performance.now();
        for (let k = 0; k <= maxIssues; k++) {
            const combinations = this.getCombinations(issueUnions, k);

            for (const combo of combinations) {
                const otherUnions = issueUnions.filter((iu) => !combo.includes(iu));
                const candidateGeometry = this.computeCandidateGeometry(greenFeature, combo, otherUnions);

                if (!candidateGeometry) continue;

                const flattened = turf.flatten(candidateGeometry as Feature<Polygon | MultiPolygon>);

                for (const flat of flattened.features) {
                    const area = turf.area(flat);
                    if (area < MIN_AREA_M2) continue;

                    const issues: ReportIssueDTO[] = combo.map(({ description, suitability }) => ({
                        description,
                        suitability,
                    }));

                    const regionPolygon = flat as Feature<Polygon>;
                    const _tLV = performance.now();
                    const layerValues = this.computeLayerValuesForRegion(regionPolygon, activeDataLayers);
                    _tLayerValuesTotal += performance.now() - _tLV;
                    const energyPotential = this.computeRegionEnergyPotential(regionPolygon, area / 1e6, issues);

                    regions.push({
                        id: `region-${regionIndex++}`,
                        polygon: regionPolygon,
                        bbox: turf.bbox(flat),
                        areaSqKm: area / 1e6,
                        issueCount: combo.length,
                        issues,
                        layerValues,
                        energyPotential,
                    });
                }
            }
        }
        console.debug(`[generateReport] combinations loop (${regions.length} regions): ${(performance.now() - _tCombos).toFixed(1)}ms`);
        console.debug(`[generateReport] computeLayerValuesForRegion total: ${_tLayerValuesTotal.toFixed(1)}ms`);
        console.debug(`[generateReport] total: ${(performance.now() - _t0).toFixed(1)}ms`);

        return { regions, totalRegions: regions.length, selectedPolygon, assumptions };
    }

    /**
     * Build the list of user-configured assumptions from all submitted data layers.
     * Each attribute with a label is recorded; attributes without a label are skipped.
     */
    private buildAssumptions(dataLayers: DataLayerDto[]): ReportAssumptionDTO[] {
        const assumptions: ReportAssumptionDTO[] = [];
        for (const layer of dataLayers) {
            for (const attr of layer.attributes) {
                if (!attr.label) continue;
                assumptions.push({
                    layerId: layer.id,
                    attributeId: attr.id,
                    label: attr.label,
                    value: attr.value,
                });
            }
        }
        return assumptions;
    }

    /**
     * Group issue features by their `properties.issue` description and return one
     * unioned polygon per distinct description. The union defines the exact boundary
     * for that issue type — required so that flattened sub-regions align cleanly with
     * issue edges and can be correctly annotated.
     */
    private buildIssueUnions(issueFeatures: Feature<Polygon | MultiPolygon, GeoJsonProperties>[]): IssueUnion[] {
        const groupMap = new Map<string, { suitability: string; features: Feature<Polygon | MultiPolygon, GeoJsonProperties>[] }>();

        for (const feature of issueFeatures) {
            const description = (feature.properties?.issue as string) ?? 'unknown';
            if (description === 'Unsuitable land') {
                // The imported unsuitable-land mask can be extremely detailed.
                // Excluding it from combinatorial report splitting avoids stack overflows
                // in downstream polygon operations while preserving heatmap behavior.
                continue;
            }
            const suitability = (feature.properties?.suitability as string) ?? 'unknown';
            if (!groupMap.has(description)) {
                groupMap.set(description, { suitability, features: [] });
            }
            groupMap.get(description)!.features.push(feature);
        }

        const issueUnions: IssueUnion[] = [];
        groupMap.forEach(({ suitability, features }, description) => {
            const union = this.mergeGeometryFeatures(features);
            if (union) issueUnions.push({ description, suitability, union });
        });
        return issueUnions;
    }

    /**
     * Merge many polygon features into one geometry with a stack-safe strategy.
     * Uses `combine` first (fast and non-recursive), then falls back to geometric
     * union only if needed.
     */
    private mergeGeometryFeatures(
        features: Feature<Polygon | MultiPolygon, GeoJsonProperties>[]
    ): Feature<Polygon | MultiPolygon, GeoJsonProperties> | null {
        if (features.length === 0) return null;
        if (features.length === 1) return features[0];

        try {
            const combined = turf.combine(turf.featureCollection(features));
            const merged = combined.features[0] as Feature<Polygon | MultiPolygon, GeoJsonProperties> | undefined;
            if (merged) {
                return merged;
            }
        } catch {
            // Fall through to topology-union fallback below.
        }

        try {
            return this.unionAll(features);
        } catch (error) {
            if (error instanceof RangeError) {
                console.warn('[generateReport] geometry merge fallback used after stack overflow in unionAll');
                const bbox = turf.bbox(turf.featureCollection(features));
                return turf.bboxPolygon(bbox) as Feature<Polygon | MultiPolygon, GeoJsonProperties>;
            }
            throw error;
        }
    }

    /**
     * Compute the geometry for regions that have EXACTLY the issues in `combo`
     * and none of the issues in `otherUnions`.
     *
     * - If combo is empty: subtract all issue unions from the green area.
     * - If combo is non-empty: intersect the green area with each combo union,
     *   then subtract all other issue unions.
     *
     * Returns null if the result is empty (no such area exists).
     */
    private computeCandidateGeometry(
        greenFeature: Feature<Polygon | MultiPolygon, GeoJsonProperties>,
        combo: IssueUnion[],
        otherUnions: IssueUnion[]
    ): Feature<Polygon | MultiPolygon, GeoJsonProperties> | null {
        let region: Feature<Polygon | MultiPolygon, GeoJsonProperties> | null = greenFeature;

        // Intersect with each issue union in the combo
        for (const { union } of combo) {
            if (!region) return null;
            // Fast reject before the expensive intersect
            if (!this.bboxesOverlap(turf.bbox(region), turf.bbox(union))) return null;
            region = turf.intersect(turf.featureCollection([region, union]));
        }

        if (!region) return null;

        // Subtract all issue unions not in this combo
        for (const { union } of otherUnions) {
            if (!region) return null;
            if (!this.bboxesOverlap(turf.bbox(region), turf.bbox(union))) continue;
            region = turf.difference(turf.featureCollection([region, union]));
        }

        return region;
    }

    /** Returns true when two [west,south,east,north] bounding boxes overlap. */
    private bboxesOverlap(a: number[], b: number[]): boolean {
        return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
    }

    /**
     * Union an array of polygon features into a single feature using divide-and-conquer.
     * This keeps intermediate geometries balanced in size, avoiding the O(N) chain of
     * ever-growing unions produced by a sequential left-fold.
     */
    private unionAll(features: Feature<Polygon | MultiPolygon, GeoJsonProperties>[]): Feature<Polygon | MultiPolygon, GeoJsonProperties> | null {
        if (features.length === 0) return null;
        if (features.length === 1) return features[0];
        if (features.length === 2) return turf.union(turf.featureCollection([features[0], features[1]]));

        const mid = Math.floor(features.length / 2);
        const left = this.unionAll(features.slice(0, mid));
        const right = this.unionAll(features.slice(mid));
        if (!left) return right;
        if (!right) return left;
        return turf.union(turf.featureCollection([left, right]));
    }

    /**
     * Return all size-k combinations from `arr` without repetition.
     */
    private getCombinations<T>(arr: T[], k: number): T[][] {
        if (k === 0) return [[]];
        if (arr.length < k) return [];

        const [first, ...rest] = arr;
        const withFirst = this.getCombinations(rest, k - 1).map((combo) => [first, ...combo]);
        const withoutFirst = this.getCombinations(rest, k);

        return [...withFirst, ...withoutFirst];
    }

    /**
     * Compute layer-specific values for the given candidate region polygon.
     * The ALC grade is always included when a data provider is available.
     * Additional values are computed for each active data layer.
     */
    private computeLayerValuesForRegion(region: Feature<Polygon>, activeDataLayers: DataLayerDto[]): ReportRegionLayerValueDTO[] {
        if (!this.dataProviderUtils) return [];

        const centroid = turf.centroid(region) as Feature<Point>;
        const results: ReportRegionLayerValueDTO[] = [];

        // Always include agricultural land classification
        const alcData = this.dataProviderUtils.getAgriculturalLandClassificationData();
        const alcValue = this.computeAlcGradeAtCentroid(centroid, alcData);
        results.push({ layerId: 'agriculturalLandClassification', label: 'Agricultural land classification', value: alcValue, unit: '' });

        // Always include nearest substation name and distance
        const substationData = this.dataProviderUtils.readGridSupplyPointData();
        const nearestSubstation = this.computeNearestSubstation(centroid, substationData);
        results.push({ layerId: 'nearestSubstationName', label: 'Nearest substation', value: nearestSubstation?.name ?? null, unit: '' });
        results.push({
            layerId: 'nearestSubstationDistance',
            label: 'Distance to nearest substation',
            value: nearestSubstation?.distanceKm ?? null,
            unit: 'km',
        });

        for (const layer of activeDataLayers) {
            switch (layer.id) {
                case 'windSpeed': {
                    const data = this.dataProviderUtils.getWindspeedLayerData();
                    const value = this.computeGridValueAtCentroid(centroid, data, 'ws_spring1');
                    results.push({ layerId: 'windSpeed', label: 'Wind speed', value, unit: 'm/s' });
                    break;
                }
                case 'solarPotential': {
                    const data = this.dataProviderUtils.getSolarPotentialLayerData();
                    const value = this.computeGridValueAtCentroid(centroid, data, 'pv_annual_kwh_kwp');
                    results.push({ layerId: 'solarPotential', label: 'Solar potential', value, unit: 'kWh/kWp/year' });
                    break;
                }
                case 'sitesOfSpecialScientificInterest': {
                    const data = this.dataProviderUtils.getSitesOfSpecialScientificInterestLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'sitesOfSpecialScientificInterest', label: 'Distance to nearest SSSI boundary', value, unit: 'km' });
                    break;
                }
                case 'specialAreasOfConservation': {
                    const data = this.dataProviderUtils.getSpecialAreasOfConservationLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'specialAreasOfConservation', label: 'Distance to nearest SAC boundary', value, unit: 'km' });
                    break;
                }
                case 'builtUpAreas': {
                    const data = this.dataProviderUtils.getBuiltupAreasLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'builtUpAreas', label: 'Distance to nearest built-up area boundary', value, unit: 'km' });
                    break;
                }
                case 'areasOfOutstandingNaturalBeauty': {
                    const data = this.dataProviderUtils.getAreasOfNaturalBeautyLayerData();
                    const value = this.computeDistanceToNearestBoundaryKm(centroid, data);
                    results.push({ layerId: 'areasOfOutstandingNaturalBeauty', label: 'Distance to nearest AONB boundary', value, unit: 'km' });
                    break;
                }
                case 'unsuitableLand': {
                    const data = this.dataProviderUtils.getUnsuitableLandLayerData();
                    const value = this.isPointInsideLayer(centroid, data) ? 'Yes' : 'No';
                    results.push({ layerId: 'unsuitableLand', label: 'Within unsuitable land', value, unit: '' });
                    break;
                }
            }
        }

        return results;
    }

    /**
     * Compute annual energy potential and theoretical max asset counts for a region.
     * Rules:
     * - Only compute for regions with at most one issue.
     * - If the only issue is a slope suitability issue for one technology,
     *   only compute potential for the other suitable technology.
     */
    private computeRegionEnergyPotential(
        region: Feature<Polygon>,
        areaSqKm: number,
        issues: ReportIssueDTO[]
    ): ReportRegionEnergyPotentialDTO {
        const eligibility = this.getTechnologyEligibilityForPotential(issues);
        if (!eligibility.includeRegion) {
            return {
                solarAnnualMWh: null,
                windAnnualMWh: null,
                solarMaxAssets: null,
                windMaxAssets: null,
            };
        }

        const windModel = this.getBestWindModel();
        const solarAssetCapacityMW = this.getSolarAssetCapacityMW();

        const solarMaxAssets = eligibility.solarEligible
            ? Math.max(0, Math.floor((areaSqKm * SOLAR_DENSITY_MW_PER_KM2) / solarAssetCapacityMW))
            : null;
        const windMaxAssets = eligibility.windEligible ? this.getWindMaxAssetsFromSpacing(areaSqKm, windModel) : null;

        const solarPerAssetAnnualMWh = this.getSolarAnnualMWhPerAsset(solarAssetCapacityMW);
        const windPerAssetAnnualMWh = this.getWindAnnualMWhPerAssetAtRegion(region, windModel);

        return {
            solarAnnualMWh: solarMaxAssets !== null ? roundTo(solarPerAssetAnnualMWh * solarMaxAssets, 3) : null,
            windAnnualMWh: windMaxAssets !== null ? roundTo(windPerAssetAnnualMWh * windMaxAssets, 3) : null,
            solarMaxAssets,
            windMaxAssets,
        };
    }

    private getTechnologyEligibilityForPotential(issues: ReportIssueDTO[]): { includeRegion: boolean; solarEligible: boolean; windEligible: boolean } {
        if (issues.length > 1) {
            return { includeRegion: false, solarEligible: false, windEligible: false };
        }

        if (issues.length === 0) {
            return { includeRegion: true, solarEligible: true, windEligible: true };
        }

        const issueText = issues[0].description.toLowerCase();
        const isSlopeSuitabilityIssue = issueText.includes('terrain suitability') && issueText.includes('steep slope');

        if (!isSlopeSuitabilityIssue) {
            return { includeRegion: true, solarEligible: true, windEligible: true };
        }

        if (issueText.includes('solar terrain suitability')) {
            return { includeRegion: true, solarEligible: false, windEligible: true };
        }

        if (issueText.includes('wind terrain suitability')) {
            return { includeRegion: true, solarEligible: true, windEligible: false };
        }

        return { includeRegion: true, solarEligible: true, windEligible: true };
    }

    private getSolarAnnualMWhPerAsset(solarAssetCapacityMW: number): number {
        const kk = this.dataProviderUtils?.getSolarKkData().cardinal[SOLAR_ORIENTATION_SOUTH] ?? DEFAULT_SOLAR_KK;
        return (solarAssetCapacityMW * 1000 * kk * SOLAR_SHADING_FACTOR) / 1000;
    }

    private getSolarAssetCapacityMW(): number {
        if (!this.dataProviderUtils) return DEFAULT_SOLAR_ASSET_CAPACITY_MW;

        const assets = this.dataProviderUtils.readAssetsData();
        const solarAsset = assets.find((asset) => String(asset.id).toLowerCase().includes('solar'));
        if (!solarAsset || !Array.isArray(solarAsset.variations) || solarAsset.variations.length === 0) {
            return DEFAULT_SOLAR_ASSET_CAPACITY_MW;
        }

        const farmVariation = solarAsset.variations.find((variation) => String(variation.name).toLowerCase().includes('farm'));
        if (farmVariation) {
            const farmCapacity = this.getVariationPowerSpecMW(farmVariation, ['capacity', 'rated wattage', 'rated power', 'wattage']);
            if (farmCapacity !== null && farmCapacity > 0) {
                return farmCapacity;
            }
        }

        let bestSolarCapacityMW: number | null = null;
        for (const variation of solarAsset.variations) {
            const capacity = this.getVariationPowerSpecMW(variation, ['capacity', 'rated wattage', 'rated power', 'wattage']);
            if (capacity !== null && capacity > 0 && (bestSolarCapacityMW === null || capacity > bestSolarCapacityMW)) {
                bestSolarCapacityMW = capacity;
            }
        }

        return bestSolarCapacityMW ?? DEFAULT_SOLAR_ASSET_CAPACITY_MW;
    }

    private getWindAnnualMWhPerAssetAtRegion(region: Feature<Polygon>, model: WindModel): number {
        const seasonal = this.getSeasonalWindspeedAtRegionCentroid(region);
        if (!seasonal) {
            return model.capacityMW * HOURS_PER_YEAR * DEFAULT_WIND_CAPACITY_FACTOR;
        }

        const radiusM = model.rotorDiameterM / 2;
        const sweptAreaM2 = Math.PI * radiusM ** 2;
        const seasonalSpeeds = [seasonal.spring, seasonal.summer, seasonal.autumn, seasonal.winter];
        const seasonalPowerMW = seasonalSpeeds.map((windSpeedMs) => {
            if (windSpeedMs < model.cutInSpeedMs || windSpeedMs > model.cutOutSpeedMs) {
                return 0;
            }
            const powerW = 0.5 * model.airDensityKgPerM3 * sweptAreaM2 * windSpeedMs ** 3 * model.powerCoefficient;
            const powerMW = powerW / 1_000_000;
            return clamp(powerMW, 0, model.capacityMW);
        });

        return seasonalPowerMW.reduce((sum, powerMW) => sum + powerMW * HOURS_PER_SEASON, 0);
    }

    /**
     * Estimate the theoretical maximum number of wind turbines from area using a typical
     * spacing rule (7D x 4D) and a minimum one-turbine fit check.
     */
    private getWindMaxAssetsFromSpacing(areaSqKm: number, model: WindModel): number {
        const rotorDiameterM = model.rotorDiameterM;
        if (!Number.isFinite(rotorDiameterM) || rotorDiameterM <= 0) {
            return 0;
        }

        const singleTurbineMinAreaSqKm = (Math.PI * WIND_SINGLE_TURBINE_MIN_RADIUS_M ** 2) / 1_000_000;
        if (areaSqKm < singleTurbineMinAreaSqKm) {
            return 0;
        }

        const spacingCellAreaSqKm =
            ((WIND_SPACING_DOWNWIND_DIAMETERS * rotorDiameterM) * (WIND_SPACING_CROSSWIND_DIAMETERS * rotorDiameterM)) / 1_000_000;
        if (areaSqKm < spacingCellAreaSqKm) {
            return 1;
        }

        return Math.max(1, Math.floor(areaSqKm / spacingCellAreaSqKm));
    }

    private getSeasonalWindspeedAtRegionCentroid(region: Feature<Polygon>): SeasonalWindspeed | null {
        if (!this.dataProviderUtils) return null;

        const centroid = turf.centroid(region) as Feature<Point>;
        const windspeedLayer = this.dataProviderUtils.getWindspeedLayerData();

        for (const feature of windspeedLayer.features) {
            for (const coordinates of feature.geometry.coordinates) {
                const polygon = turf.polygon(coordinates);
                if (turf.booleanPointInPolygon(centroid, polygon)) {
                    const spring = Number(feature.properties?.ws_spring1);
                    const summer = Number(feature.properties?.ws_summer1);
                    const autumn = Number(feature.properties?.ws_autumn1);
                    const winter = Number(feature.properties?.ws_winter1);

                    const values = [spring, summer, autumn, winter];
                    if (values.every((value) => Number.isFinite(value) && value > 0)) {
                        return { spring, summer, autumn, winter };
                    }
                }
            }
        }

        return null;
    }

    private getBestWindModel(): WindModel {
        if (!this.dataProviderUtils) {
            return { ...DEFAULT_WIND_MODEL };
        }

        const assets = this.dataProviderUtils.readAssetsData();
        const windAsset = assets.find((asset) => String(asset.id).toLowerCase().includes('wind'));
        if (!windAsset || !Array.isArray(windAsset.variations) || windAsset.variations.length === 0) {
            return { ...DEFAULT_WIND_MODEL };
        }

        let best: WindModel | null = null;
        for (const variation of windAsset.variations) {
            const capacityMW = this.getVariationSpecNumber(variation, ['capacity', 'rated wattage', 'rated power']) ?? DEFAULT_WIND_MODEL.capacityMW;
            const model: WindModel = {
                capacityMW,
                rotorDiameterM: this.getVariationSpecNumber(variation, ['rotor diameter']) ?? DEFAULT_WIND_MODEL.rotorDiameterM,
                powerCoefficient: this.getVariationSpecNumber(variation, ['power coefficient', '(cp)']) ?? DEFAULT_WIND_MODEL.powerCoefficient,
                airDensityKgPerM3: this.getVariationSpecNumber(variation, ['air density']) ?? DEFAULT_WIND_MODEL.airDensityKgPerM3,
                cutInSpeedMs: this.getVariationSpecNumber(variation, ['cut-in']) ?? DEFAULT_WIND_MODEL.cutInSpeedMs,
                cutOutSpeedMs: this.getVariationSpecNumber(variation, ['cut-out']) ?? DEFAULT_WIND_MODEL.cutOutSpeedMs,
            };

            if (!best || model.capacityMW > best.capacityMW) {
                best = model;
            }
        }

        return best ?? { ...DEFAULT_WIND_MODEL };
    }

    private getVariationSpecNumber(variation: unknown, specNameHints: string[]): number | null {
        const specs = (variation as { specification?: unknown[] })?.specification;
        if (!Array.isArray(specs)) return null;

        for (const spec of specs) {
            const specName = String((spec as { name?: unknown; key?: unknown }).name ?? (spec as { key?: unknown }).key ?? '').toLowerCase();
            if (!specNameHints.some((hint) => specName.includes(hint))) {
                continue;
            }

            const rawValue = (spec as { value?: unknown }).value;
            const parsed = parseFirstNumber(rawValue);
            if (parsed !== null && parsed > 0) {
                return parsed;
            }
        }

        return null;
    }

    private getVariationPowerSpecMW(variation: unknown, specNameHints: string[]): number | null {
        const specs = (variation as { specification?: unknown[] })?.specification;
        if (!Array.isArray(specs)) return null;

        for (const spec of specs) {
            const specName = String((spec as { name?: unknown; key?: unknown }).name ?? (spec as { key?: unknown }).key ?? '').toLowerCase();
            if (!specNameHints.some((hint) => specName.includes(hint))) {
                continue;
            }

            const rawValue = (spec as { value?: unknown }).value;
            const parsed = parsePowerToMW(rawValue);
            if (parsed !== null && parsed > 0) {
                return parsed;
            }
        }

        return null;
    }

    /**
     * Find the nearest grid supply point to the given centroid and return its display name
     * and distance in kilometres. Returns null when the dataset has no features.
     */
    private computeNearestSubstation(centroid: Feature<Point>, substationData: FeatureCollection): { name: string; distanceKm: number } | null {
        if (substationData.features.length === 0) return null;

        let nearest: { name: string; distanceKm: number } | null = null;

        for (const feature of substationData.features) {
            if (feature.geometry?.type !== 'Point') continue;
            const to = turf.point((feature.geometry as Point).coordinates);
            const dist = turf.distance(centroid, to, { units: 'kilometers' });
            if (nearest === null || dist < nearest.distanceKm) {
                const props = feature.properties ?? {};
                const name =
                    [props['Locality'], props['Operating Area'], props['Owner Name']]
                        .filter((part): part is string => typeof part === 'string' && part !== '')
                        .join('-') || 'Unknown';
                nearest = { name, distanceKm: Math.round(dist * 100) / 100 };
            }
        }

        return nearest;
    }

    /**
     * Find the first ALC polygon that contains the given centroid point and return its
     * ALC_GRADE property as a string. Returns null when the centroid falls outside all polygons.
     */
    private computeAlcGradeAtCentroid(centroid: Feature<Point>, layerData: FeatureCollection<MultiPolygon>): string | null {
        const [cLng, cLat] = centroid.geometry.coordinates;
        for (const feature of layerData.features) {
            const fb = turf.bbox(feature);
            // Point-in-bbox fast reject
            if (cLng < fb[0] || cLng > fb[2] || cLat < fb[1] || cLat > fb[3]) continue;
            for (const coords of feature.geometry.coordinates) {
                const poly = turf.polygon(coords);
                if (turf.booleanPointInPolygon(centroid, poly)) {
                    const grade = feature.properties?.['ALC_GRADE'];
                    return typeof grade === 'string' ? grade : null;
                }
            }
        }
        return null;
    }

    /**
     * Find the first MultiPolygon grid cell that contains the given centroid point and return the
     * numeric value of `propertyKey` from its properties. Returns null when no cell matches.
     */
    private computeGridValueAtCentroid(centroid: Feature<Point>, layerData: FeatureCollection<MultiPolygon>, propertyKey: string): number | null {
        const [cLng, cLat] = centroid.geometry.coordinates;
        for (const feature of layerData.features) {
            const fb = turf.bbox(feature);
            // Point-in-bbox fast reject
            if (cLng < fb[0] || cLng > fb[2] || cLat < fb[1] || cLat > fb[3]) continue;
            for (const coords of feature.geometry.coordinates) {
                const poly = turf.polygon(coords);
                if (turf.booleanPointInPolygon(centroid, poly)) {
                    const val = feature.properties?.[propertyKey];
                    return typeof val === 'number' ? Math.round(val * 100) / 100 : null;
                }
            }
        }
        return null;
    }

    /**
     * Compute the minimum distance in kilometres from `centroid` to the nearest boundary of any
     * feature in `layerData`. Returns 0 when the centroid falls inside a feature, and null when
     * the layer has no features.
     */
    private computeDistanceToNearestBoundaryKm(centroid: Feature<Point>, layerData: FeatureCollection<MultiPolygon>): number | null {
        if (layerData.features.length === 0) return null;

        let minDistKm: number | null = null;
        const [cLng, cLat] = centroid.geometry.coordinates;

        for (const feature of layerData.features) {
            // Feature-level bbox lower-bound: if the closest point on the bbox is already
            // farther than the current best, the full geometry can't beat it.
            const fb = turf.bbox(feature);
            const fbDxDeg = Math.max(fb[0] - cLng, 0, cLng - fb[2]);
            const fbDyDeg = Math.max(fb[1] - cLat, 0, cLat - fb[3]);
            const fbLowerBoundKm = Math.sqrt(fbDxDeg * fbDxDeg + fbDyDeg * fbDyDeg) * 111;
            if (minDistKm !== null && fbLowerBoundKm >= minDistKm) continue;

            for (const coords of feature.geometry.coordinates) {
                // Sub-polygon bbox lower-bound
                const outerRing = coords[0];
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
                const sDxDeg = Math.max(minLng - cLng, 0, cLng - maxLng);
                const sDyDeg = Math.max(minLat - cLat, 0, cLat - maxLat);
                const sLowerBoundKm = Math.sqrt(sDxDeg * sDxDeg + sDyDeg * sDyDeg) * 111;
                if (minDistKm !== null && sLowerBoundKm >= minDistKm) continue;

                const poly = turf.polygon(coords);
                if (turf.booleanPointInPolygon(centroid, poly)) {
                    return 0;
                }
                const outerLineString = turf.lineString(outerRing);
                const dist = turf.pointToLineDistance(centroid, outerLineString, { units: 'kilometers' });
                if (minDistKm === null || dist < minDistKm) {
                    minDistKm = dist;
                }
            }
        }

        return minDistKm !== null ? Math.round(minDistKm * 100) / 100 : null;
    }

    private isPointInsideLayer(centroid: Feature<Point>, layerData: FeatureCollection<MultiPolygon | Polygon>): boolean {
        for (const feature of layerData.features) {
            const geometry = feature.geometry;
            if (geometry.type === 'Polygon') {
                const polygon = turf.polygon(geometry.coordinates);
                if (turf.booleanPointInPolygon(centroid, polygon)) return true;
                continue;
            }

            if (geometry.type === 'MultiPolygon') {
                for (const coordinates of geometry.coordinates) {
                    const polygon = turf.polygon(coordinates);
                    if (turf.booleanPointInPolygon(centroid, polygon)) return true;
                }
            }
        }

        return false;
    }
}
