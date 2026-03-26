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

    return (
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

                        {layerValues.length > 0 && (
                            <div className="layer-values">
                                <div className="stat-label">Layer Values</div>
                                <div className="layer-values-grid">
                                    {layerValues.map((lv) => (
                                        <div key={lv.layerId} className="layer-value-item">
                                            <span className="layer-value-label" title={lv.label}>
                                                {getSlideLayerLabel(lv.layerId, lv.label)}
                                            </span>
                                            <span className="layer-value-val">{formatLayerValue(lv.value, lv.unit)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </Slide>
    );
};

export default RegionSlide;
