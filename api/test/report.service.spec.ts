// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { FeatureCollection, Geometry } from 'geojson';
import { ReportService } from '../src/services/report.service';
import { DataProviderUtils } from '../src/utils/data-provider.utils';

function makePolygonFeature(minLon: number, minLat: number, maxLon: number, maxLat: number, properties: Record<string, unknown> = {}) {
    return {
        type: 'Feature' as const,
        properties,
        geometry: {
            type: 'Polygon' as const,
            coordinates: [
                [
                    [minLon, minLat],
                    [maxLon, minLat],
                    [maxLon, maxLat],
                    [minLon, maxLat],
                    [minLon, minLat],
                ],
            ],
        },
    };
}

/**
 * Test setup:
 *  greenPolygon:  [-2, 51] → [-1, 52]    (full 1° × 1° square)
 *  issuePoly1:   [-2, 51] → [-1.5, 52]   (left half     — "Built up area", suitability: "red")
 *  issuePoly2:   [-1.5, 51] → [-1, 51.5] (bottom-right  — "SSSI",          suitability: "darkRed")
 *
 *  Resulting regions (maxIssues=1):
 *   A – top-right    [-1.5, 51.5] → [-1, 52]  — 0 issues
 *   B – bottom-right [-1.5, 51]   → [-1, 51.5] — 1 issue (SSSI)
 *   C – left half    [-2, 51]     → [-1.5, 52] — 1 issue (Built up area)
 */
const greenPolygon = makePolygonFeature(-2, 51, -1, 52, { suitability: 'green' });
const issuePoly1 = makePolygonFeature(-2, 51, -1.5, 52, { suitability: 'red', issue: 'Built up area' });
const issuePoly2 = makePolygonFeature(-1.5, 51, -1, 51.5, { suitability: 'darkRed', issue: 'SSSI' });

function makeResult(...features: object[]): FeatureCollection<Geometry> {
    return { type: 'FeatureCollection', features } as FeatureCollection<Geometry>;
}

describe('ReportService', () => {
    let service: ReportService;

    beforeEach(() => {
        service = new ReportService();
    });

    describe('generateReport — no green feature', () => {
        it('returns an empty report when analysisResult has no green feature', () => {
            const report = service.generateReport(makeResult(issuePoly1), 1);

            expect(report.regions).toHaveLength(0);
            expect(report.totalRegions).toBe(0);
        });
    });

    describe('generateReport — green only (no issues)', () => {
        it('returns one region for maxIssues=0 when there are no issue polygons', () => {
            const report = service.generateReport(makeResult(greenPolygon), 0);

            expect(report.regions).toHaveLength(1);
            expect(report.totalRegions).toBe(1);
            expect(report.regions[0].issueCount).toBe(0);
            expect(report.regions[0].issues).toHaveLength(0);
        });

        it('region has a valid bbox with [minLon, minLat, maxLon, maxLat] ordering', () => {
            const { regions } = service.generateReport(makeResult(greenPolygon), 0);
            const [minLon, minLat, maxLon, maxLat] = regions[0].bbox;

            expect(minLon).toBeLessThan(maxLon);
            expect(minLat).toBeLessThan(maxLat);
        });

        it('region has a positive areaSqKm', () => {
            const { regions } = service.generateReport(makeResult(greenPolygon), 0);

            expect(regions[0].areaSqKm).toBeGreaterThan(0);
        });

        it('region has a stable id of "region-1"', () => {
            expect(service.generateReport(makeResult(greenPolygon), 0).regions[0].id).toBe('region-1');
        });

        it('region has an empty layerValues array when no active layers are provided', () => {
            const { regions } = service.generateReport(makeResult(greenPolygon), 0);

            expect(regions[0].layerValues).toEqual([]);
        });
    });

    describe('generateReport — maxIssues=0 with issues present', () => {
        it('returns only the area not covered by any issue polygon', () => {
            const report = service.generateReport(makeResult(greenPolygon, issuePoly1, issuePoly2), 0);

            // Only region A (top-right quarter) should survive
            expect(report.regions).toHaveLength(1);
            expect(report.regions[0].issueCount).toBe(0);
            expect(report.regions[0].issues).toHaveLength(0);
        });

        it('zero-issue region is smaller than the full green area', () => {
            const fullArea = service.generateReport(makeResult(greenPolygon), 0).regions[0].areaSqKm;
            const filteredArea = service.generateReport(makeResult(greenPolygon, issuePoly1, issuePoly2), 0).regions[0].areaSqKm;

            expect(filteredArea).toBeLessThan(fullArea);
        });
    });

    describe('generateReport — maxIssues=1 with two non-overlapping issue types', () => {
        it('returns 3 regions: one zero-issue and one per issue type', () => {
            const report = service.generateReport(makeResult(greenPolygon, issuePoly1, issuePoly2), 1);

            expect(report.regions).toHaveLength(3);
        });

        it('each issue type is represented exactly once in single-issue regions', () => {
            const { regions } = service.generateReport(makeResult(greenPolygon, issuePoly1, issuePoly2), 1);
            const singleIssueRegions = regions.filter((r) => r.issueCount === 1);

            const issueDescriptions = singleIssueRegions.map((r) => r.issues[0].description).sort();
            expect(issueDescriptions).toEqual(['Built up area', 'SSSI']);
        });

        it('single-issue regions carry the correct suitability from the source feature', () => {
            const { regions } = service.generateReport(makeResult(greenPolygon, issuePoly1, issuePoly2), 1);
            const builtUpRegion = regions.find((r) => r.issues[0]?.description === 'Built up area');
            const sssiRegion = regions.find((r) => r.issues[0]?.description === 'SSSI');

            expect(builtUpRegion?.issues[0].suitability).toBe('red');
            expect(sssiRegion?.issues[0].suitability).toBe('darkRed');
        });

        it('all regions have positive area and valid bbox', () => {
            for (const region of service.generateReport(makeResult(greenPolygon, issuePoly1, issuePoly2), 1).regions) {
                expect(region.areaSqKm).toBeGreaterThan(0);
                const [minLon, minLat, maxLon, maxLat] = region.bbox;
                expect(minLon).toBeLessThan(maxLon);
                expect(minLat).toBeLessThan(maxLat);
            }
        });

        it('totalRegions matches the length of the regions array', () => {
            const report = service.generateReport(makeResult(greenPolygon, issuePoly1, issuePoly2), 1);

            expect(report.totalRegions).toBe(report.regions.length);
        });
    });

    describe('generateReport — multiple features of the same issue type are unioned before processing', () => {
        it('treats two features with the same issue description as a single issue type', () => {
            const issuePolyA = makePolygonFeature(-2, 51, -1.75, 52, { suitability: 'red', issue: 'Built up area' });
            const issuePolyB = makePolygonFeature(-1.75, 51, -1.5, 52, { suitability: 'red', issue: 'Built up area' });

            const { regions } = service.generateReport(makeResult(greenPolygon, issuePolyA, issuePolyB, issuePoly2), 1);
            const singleIssueRegions = regions.filter((r) => r.issueCount === 1);

            // Should still be 2 distinct issue types (Built up area + SSSI), not 3
            const issueDescriptions = singleIssueRegions.map((r) => r.issues[0].description).sort();
            expect(issueDescriptions).toEqual(['Built up area', 'SSSI']);
        });
    });

    describe('generateReport — weighted suitability scoring', () => {
        it('uses layerWeight defaults of 1 when not provided and computes score as weightedIssueSum / totalLayerWeight', () => {
            const weightedIssueA = makePolygonFeature(-2, 51, -1.5, 52, {
                suitability: 'red',
                issue: 'Issue A',
                sourceLayerId: 'builtUpAreas',
            });

            const weightedIssueB = makePolygonFeature(-1.5, 51, -1, 51.5, {
                suitability: 'darkRed',
                issue: 'Issue B',
                sourceLayerId: 'sitesOfSpecialScientificInterest',
            });

            const layers = [
                { id: 'builtUpAreas', analyze: true, attributes: [] },
                { id: 'sitesOfSpecialScientificInterest', analyze: true, attributes: [] },
            ];

            const { regions } = service.generateReport(makeResult(greenPolygon, weightedIssueA, weightedIssueB), 1, layers);
            const singleIssueRegions = regions.filter((region) => region.issueCount === 1);

            expect(singleIssueRegions).toHaveLength(2);
            singleIssueRegions.forEach((region) => {
                expect(region.weightedIssueSum).toBe(1);
                expect(region.totalLayerWeight).toBe(2);
                expect(region.suitabilityScore).toBeCloseTo(0.5);
            });
        });

        it('prioritises region ranking by suitabilityScore then area', () => {
            const issueA = makePolygonFeature(-2, 51, -1.5, 52, {
                suitability: 'red',
                issue: 'Issue A',
                sourceLayerId: 'builtUpAreas',
            });

            const issueB = makePolygonFeature(-1.75, 51, -1, 52, {
                suitability: 'red',
                issue: 'Issue B',
                sourceLayerId: 'specialAreasOfConservation',
            });

            const layers = [
                { id: 'builtUpAreas', analyze: true, attributes: [{ id: 'layerWeight', value: 0.2 }] },
                { id: 'specialAreasOfConservation', analyze: true, attributes: [{ id: 'layerWeight', value: 0.8 }] },
            ];

            const { regions } = service.generateReport(makeResult(greenPolygon, issueA, issueB), 2, layers);

            expect(regions[0].suitabilityScore).toBeLessThanOrEqual(regions[1].suitabilityScore);

            const tiedByScore = regions.filter((region) => region.suitabilityScore === regions[0].suitabilityScore);
            if (tiedByScore.length > 1) {
                for (let i = 1; i < tiedByScore.length; i++) {
                    expect(tiedByScore[i - 1].areaSqKm).toBeGreaterThanOrEqual(tiedByScore[i].areaSqKm);
                }
            }
        });

        it('counts layer weight once when multiple issues come from the same layer', () => {
            const issueA = makePolygonFeature(-2, 51, -1.5, 52, {
                suitability: 'amber',
                issue: 'Layer A caution',
                sourceLayerId: 'specialAreasOfConservation',
            });

            const issueB = makePolygonFeature(-2, 51, -1.5, 52, {
                suitability: 'red',
                issue: 'Layer A severe',
                sourceLayerId: 'specialAreasOfConservation',
            });

            const layers = [{ id: 'specialAreasOfConservation', analyze: true, attributes: [{ id: 'layerWeight', value: 0.6 }] }];

            const { regions } = service.generateReport(makeResult(greenPolygon, issueA, issueB), 2, layers);
            const highestIssueRegion = regions.find((region) => region.issueCount >= 1);

            expect(highestIssueRegion).toBeDefined();
            expect(highestIssueRegion!.weightedIssueSum).toBeCloseTo(0.6);
            expect(highestIssueRegion!.totalLayerWeight).toBeCloseTo(0.6);
            expect(highestIssueRegion!.suitabilityScore).toBeCloseTo(1);
        });

        it('filters weighted regions by reportMaxScoreForPolygon cutoff', () => {
            const issueA = makePolygonFeature(-2, 51, -1.5, 52, {
                suitability: 'red',
                issue: 'Issue A',
                sourceLayerId: 'builtUpAreas',
            });

            const issueB = makePolygonFeature(-1.5, 51, -1, 51.5, {
                suitability: 'darkRed',
                issue: 'Issue B',
                sourceLayerId: 'sitesOfSpecialScientificInterest',
            });

            const layers = [
                { id: 'builtUpAreas', analyze: true, attributes: [] },
                { id: 'sitesOfSpecialScientificInterest', analyze: true, attributes: [] },
            ];

            const report = service.generateReport(makeResult(greenPolygon, issueA, issueB), 2, layers, null, 'weighted', 0.25);

            expect(report.reportMaxScoreForPolygonUsed).toBeCloseTo(0.25);
            expect(report.regions.every((region) => region.suitabilityScore <= 0.25)).toBe(true);
            expect(report.regions.some((region) => region.suitabilityScore === 0)).toBe(true);
        });

        it('keeps only top weighted regions when reportMaxRegions is provided', () => {
            const issueA = makePolygonFeature(-2, 51, -1.5, 52, {
                suitability: 'red',
                issue: 'Issue A',
                sourceLayerId: 'builtUpAreas',
            });

            const issueB = makePolygonFeature(-1.5, 51, -1, 51.5, {
                suitability: 'darkRed',
                issue: 'Issue B',
                sourceLayerId: 'sitesOfSpecialScientificInterest',
            });

            const layers = [
                { id: 'builtUpAreas', analyze: true, attributes: [] },
                { id: 'sitesOfSpecialScientificInterest', analyze: true, attributes: [] },
            ];

            const report = service.generateReport(makeResult(greenPolygon, issueA, issueB), 2, layers, null, 'weighted', 1, 1);

            expect(report.reportMaxRegionsUsed).toBe(1);
            expect(report.totalRegions).toBe(1);
            expect(report.regions).toHaveLength(1);
            expect(report.regions[0].suitabilityScore).toBeCloseTo(0);
        });
    });

    describe('generateReport — legacy suitability scoring', () => {
        it('uses issue-count-based suitability score when analysisMethod is legacy', () => {
            const issueA = makePolygonFeature(-2, 51, -1.5, 52, {
                suitability: 'red',
                issue: 'Issue A',
                sourceLayerId: 'builtUpAreas',
            });

            const issueB = makePolygonFeature(-1.5, 51, -1, 51.5, {
                suitability: 'darkRed',
                issue: 'Issue B',
                sourceLayerId: 'sitesOfSpecialScientificInterest',
            });

            const { regions, analysisMethod } = service.generateReport(
                makeResult(greenPolygon, issueA, issueB),
                2,
                [
                    { id: 'builtUpAreas', analyze: true, attributes: [] },
                    { id: 'sitesOfSpecialScientificInterest', analyze: true, attributes: [] },
                ],
                null,
                'legacy'
            );

            const oneIssueRegion = regions.find((region) => region.issueCount === 1);
            const zeroIssueRegion = regions.find((region) => region.issueCount === 0);

            expect(analysisMethod).toBe('legacy');
            expect(zeroIssueRegion?.suitabilityScore).toBeCloseTo(0);
            expect(oneIssueRegion?.suitabilityScore).toBeCloseTo(0.5);
        });
    });

    describe('generateReport — layerValues computed when a DataProviderUtils is supplied', () => {
        /** Build a minimal MultiPolygon FeatureCollection covering the green test polygon area */
        function makeMultiPolygonFC(properties: Record<string, unknown>) {
            return {
                type: 'FeatureCollection' as const,
                features: [
                    {
                        type: 'Feature' as const,
                        properties,
                        geometry: {
                            type: 'MultiPolygon' as const,
                            // Single ring that covers the entire [-2,51] → [-1,52] area
                            coordinates: [
                                [
                                    [
                                        [-3, 50],
                                        [0, 50],
                                        [0, 53],
                                        [-3, 53],
                                        [-3, 50],
                                    ],
                                ],
                            ],
                        },
                    },
                ],
            };
        }

        function makeMockDataProviderUtils(): DataProviderUtils {
            return {
                getWindspeedLayerData: () => makeMultiPolygonFC({ ws_spring1: 6.5 }),
                getSolarPotentialLayerData: () => makeMultiPolygonFC({ pv_annual_kwh_kwp: 950 }),
                getSitesOfSpecialScientificInterestLayerData: () => ({ type: 'FeatureCollection', features: [] }),
                getSpecialAreasOfConservationLayerData: () => ({ type: 'FeatureCollection', features: [] }),
                getBuiltupAreasLayerData: () => ({ type: 'FeatureCollection', features: [] }),
                getAreasOfNaturalBeautyLayerData: () => ({ type: 'FeatureCollection', features: [] }),
                getCoastlineData: () => makeMultiPolygonFC({}),
                getAgriculturalLandClassificationData: () => makeMultiPolygonFC({ ALC_GRADE: 'Grade 3' }),
                readGridSupplyPointData: () => ({
                    type: 'FeatureCollection' as const,
                    features: [
                        {
                            type: 'Feature' as const,
                            properties: { Locality: 'Newport', 'Operating Area': '', 'Owner Name': 'SSEN' },
                            geometry: { type: 'Point' as const, coordinates: [-1.5, 51.5] },
                        },
                    ],
                }),
            } as unknown as DataProviderUtils;
        }

        it('returns a layerValue entry for each active layer plus ALC grade and nearest substation', () => {
            const serviceWithData = new ReportService(makeMockDataProviderUtils());
            const activeLayers = [
                { id: 'windSpeed', analyze: true, attributes: [] },
                { id: 'solarPotential', analyze: true, attributes: [] },
            ];

            const { regions } = serviceWithData.generateReport(makeResult(greenPolygon), 0, activeLayers);

            expect(regions[0].layerValues).toHaveLength(5);
            expect(regions[0].layerValues.map((v) => v.layerId)).toEqual([
                'agriculturalLandClassification',
                'nearestSubstationName',
                'nearestSubstationDistance',
                'windSpeed',
                'solarPotential',
            ]);
        });

        it('returns the correct wind speed value when the centroid falls within a grid cell', () => {
            const serviceWithData = new ReportService(makeMockDataProviderUtils());
            const activeLayers = [{ id: 'windSpeed', analyze: true, attributes: [] }];

            const { regions } = serviceWithData.generateReport(makeResult(greenPolygon), 0, activeLayers);
            const windEntry = regions[0].layerValues.find((v) => v.layerId === 'windSpeed');

            expect(windEntry?.value).toBe(6.5);
            expect(windEntry?.unit).toBe('m/s');
        });

        it('returns null distance for distance-based layers when the dataset is empty', () => {
            const serviceWithData = new ReportService(makeMockDataProviderUtils());
            const activeLayers = [{ id: 'sitesOfSpecialScientificInterest', analyze: true, attributes: [] }];

            const { regions } = serviceWithData.generateReport(makeResult(greenPolygon), 0, activeLayers);
            const sssiEntry = regions[0].layerValues.find((v) => v.layerId === 'sitesOfSpecialScientificInterest');

            expect(sssiEntry?.value).toBeNull();
            expect(sssiEntry?.unit).toBe('km');
        });

        it('returns the nearest substation name and distance when the dataset is populated', () => {
            const serviceWithData = new ReportService(makeMockDataProviderUtils());

            const { regions } = serviceWithData.generateReport(makeResult(greenPolygon), 0, []);
            const nameEntry = regions[0].layerValues.find((v) => v.layerId === 'nearestSubstationName');
            const distEntry = regions[0].layerValues.find((v) => v.layerId === 'nearestSubstationDistance');

            expect(nameEntry?.value).toBe('Newport-SSEN');
            expect(distEntry?.unit).toBe('km');
            expect(typeof distEntry?.value).toBe('number');
        });

        it('returns only ALC grade and substation entries when activeDataLayers is empty', () => {
            const serviceWithData = new ReportService(makeMockDataProviderUtils());

            const { regions } = serviceWithData.generateReport(makeResult(greenPolygon), 0, []);

            expect(regions[0].layerValues).toHaveLength(3);
            expect(regions[0].layerValues.map((v) => v.layerId)).toEqual([
                'agriculturalLandClassification',
                'nearestSubstationName',
                'nearestSubstationDistance',
            ]);
        });
    });
});
