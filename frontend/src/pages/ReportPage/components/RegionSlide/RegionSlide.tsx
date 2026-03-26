// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useEffect, useState } from 'react';
import { Slide } from '@revealjs/react';
import type { ReportRegionDTO } from '../../../../types/report';
import { clipSatelliteToPolygon, formatNumber, renderSatelliteBboxWithPolygonHighlight } from '../../utils/satelliteImagery';
import { getSlideLayerLabel } from './layerLabelOverrides';

interface RegionSlideProps {
    region: ReportRegionDTO;
}

interface SatelliteState {
    status: 'loading' | 'ready' | 'error';
    clippedUrl: string | null;
    contextUrl: string | null;
    errorMessage: string | null;
}

const RegionSlide = ({ region }: RegionSlideProps) => {
    const [satellite, setSatellite] = useState<SatelliteState>({
        status: 'loading',
        clippedUrl: null,
        contextUrl: null,
        errorMessage: null,
    });
    useEffect(() => {
        let cancelled = false;

        setSatellite({ status: 'loading', clippedUrl: null, contextUrl: null, errorMessage: null });

        Promise.all([clipSatelliteToPolygon(region), renderSatelliteBboxWithPolygonHighlight(region)])
            .then(([clippedUrl, contextUrl]) => {
                if (!cancelled) {
                    setSatellite({ status: 'ready', clippedUrl, contextUrl, errorMessage: null });
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    const message = err instanceof Error ? err.message : 'Unknown error';
                    setSatellite({ status: 'error', clippedUrl: null, contextUrl: null, errorMessage: message });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [region]);

    const primaryIssue = region.issues?.[0];
    const layerValues = region.layerValues ?? [];

    const formatLayerValue = (value: string | number | null, unit: string): string => {
        if (value === null) return '—';
        const formatted = typeof value === 'number' ? formatNumber(value) : value;
        return unit ? `${formatted} ${unit}` : String(formatted);
    };

    const getLv = (id: string) => layerValues.find((lv) => lv.layerId === id) ?? null;

    const substationName = getLv('nearestSubstationName');
    const substationDist = getLv('nearestSubstationDistance');
    const fuelPovertyLv = getLv('fuelPoverty');
    const fuelPovertyWithin10km = fuelPovertyLv !== null && fuelPovertyLv.value !== null ? (fuelPovertyLv.value as number) <= 10 : null;
    const windSpeed = getLv('windSpeed');
    const solarPotential = getLv('solarPotential');

    const solarAnnualMWhText =
        region.energyPotential.solarAnnualMWh !== null ? `${formatNumber(region.energyPotential.solarAnnualMWh, 3)} MWh/year` : 'Not applicable';
    const windAnnualMWhText =
        region.energyPotential.windAnnualMWh !== null ? `${formatNumber(region.energyPotential.windAnnualMWh, 3)} MWh/year` : 'Not applicable';
    const solarAssetCountText = region.energyPotential.solarMaxAssets !== null ? String(region.energyPotential.solarMaxAssets) : 'Not applicable';
    const windAssetCountText = region.energyPotential.windMaxAssets !== null ? String(region.energyPotential.windMaxAssets) : 'Not applicable';

    const snapshotMetrics: { label: string; value: string }[] = [
        { label: 'Nearest substation', value: substationName ? formatLayerValue(substationName.value, '') : '—' },
        { label: 'Distance to substation', value: substationDist ? formatLayerValue(substationDist.value, 'km') : '—' },
        { label: 'Within 10km fuel poverty', value: fuelPovertyWithin10km === null ? '—' : fuelPovertyWithin10km ? 'Yes' : 'No' },
        { label: 'Wind speed', value: windSpeed ? formatLayerValue(windSpeed.value, 'm/s') : '—' },
        { label: 'Solar potential', value: solarPotential ? formatLayerValue(solarPotential.value, 'kWh/kWp/yr') : '—' },
        { label: 'Solar annual energy', value: solarAnnualMWhText },
        { label: 'Wind annual energy', value: windAnnualMWhText },
        { label: 'Solar asset count', value: solarAssetCountText },
        { label: 'Wind asset count', value: windAssetCountText },
    ];

    return (
        <>
            <Slide key={region.id}>
                <section className="report-slide" data-auto-animate>
                    <h2>Site Screening Report Snapshot</h2>
                    <div className="report-grid">
                        <div>
                            <div className="image-wrap">
                                {satellite.status === 'loading' && <div className="loading">Loading satellite image...</div>}
                                {satellite.status === 'error' && <div className="loading">Satellite image unavailable ({satellite.errorMessage})</div>}
                                {satellite.status === 'ready' && satellite.clippedUrl && (
                                    <img className="report-polygon-image" src={satellite.clippedUrl} alt="Satellite view clipped to selected polygon" />
                                )}
                                {satellite.status === 'ready' && satellite.contextUrl && (
                                    <img
                                        className="report-polygon-context-image"
                                        src={satellite.contextUrl}
                                        alt="Satellite view of selected area with focused polygon highlighted"
                                    />
                                )}
                            </div>
                            <p className="image-caption">Imagery source: ArcGIS World Imagery API (export endpoint)</p>
                        </div>

                        <div className="region-slide-right">
                            <div className="stats-row">
                                <div className="stat-card">
                                    <div className="stat-label">Area</div>
                                    <div className="stat-value">{formatNumber(region.areaSqKm, 3)} km²</div>
                                </div>

                                <div className="issues">
                                    <div className="stat-label">Main Issue</div>
                                    <div>
                                        {primaryIssue ? (
                                            <div className="issue-inline">
                                                <span className={`issue-pill ${primaryIssue.suitability || 'amber'}`}>
                                                    {(primaryIssue.suitability || 'amber').toUpperCase()}
                                                </span>
                                                <span className="issue-main-text">{primaryIssue.description}</span>
                                            </div>
                                        ) : (
                                            'No reported issues'
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="snapshot-metrics">
                                <table>
                                    <tbody>
                                        {snapshotMetrics.map(({ label, value }) => (
                                            <tr key={label}>
                                                <td className="snapshot-metric-label">{label}</td>
                                                <td className="snapshot-metric-value">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            </Slide>

            {layerValues.length > 0 && (
                <Slide key={`${region.id}-layers`}>
                    <section className="report-slide table-only" data-auto-animate>
                        <h2>Layer Values</h2>
                        {(() => {
                            const filtered = layerValues.filter(
                                (lv) => !['nearestSubstationName', 'nearestSubstationDistance', 'solarPotential'].includes(lv.layerId)
                            );
                            const mid = Math.ceil(filtered.length / 2);
                            const left = filtered.slice(0, mid);
                            const right = filtered.slice(mid);
                            return (
                                <div className="layer-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Metric</th>
                                                <th>Value</th>
                                                <th className="col-divider">Metric</th>
                                                <th>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {left.map((lv, i) => {
                                                const r = right[i];
                                                return (
                                                    <tr key={lv.layerId}>
                                                        <td>{getSlideLayerLabel(lv.layerId, lv.label)}</td>
                                                        <td>{formatLayerValue(lv.value, lv.unit)}</td>
                                                        {r ? (
                                                            <>
                                                                <td className="col-divider">{getSlideLayerLabel(r.layerId, r.label)}</td>
                                                                <td>{formatLayerValue(r.value, r.unit)}</td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="col-divider" />
                                                                <td />
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()}
                    </section>
                </Slide>
            )}
        </>
    );
};

export default RegionSlide;
