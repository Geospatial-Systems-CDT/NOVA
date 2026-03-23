// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { FeatureCollection, Geometry } from 'geojson';
import { ReportService } from '../src/services/report.service';

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
});
