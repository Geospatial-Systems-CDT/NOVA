// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, CircularProgress, Typography, styled } from '@mui/material';
import ControlButton from '../../../shared/control-button/ControlButton';
import ControlIcon from '../../../shared/control-icon/ControlIcon';
import { useMapStore } from '../../../stores/useMapStore';
import { useEffect, useRef, useState } from 'react';
import { CACHED_REPORT_STORAGE_KEY, type ReportDTO } from '../../../types/report';
import { DEFAULT_SUITABILITY_THRESHOLDS, loadSuitabilityThresholds } from '../../../types/reportRanking';
import { mapReportToLayerFeatureCollection } from '../../../utils/reportLayerMapper';

export interface Specification {
    name: string;
    value: string;
}

export interface Variation {
    name: string;
    specification: Specification[];
    image: string;
    icon: string;
}

export interface Asset {
    id: string;
    name: string;
    variations: Variation[];
}

const StyledContainer = styled(Box)({
    position: 'relative',
});

/** How often (ms) to poll the report job endpoint while waiting for results. */
const POLL_INTERVAL_MS = 1000;

const ReportButton = () => {
    const cachedHeatmap = useMapStore((s) => s.cachedHeatmap);
    const reportJobId = useMapStore((s) => s.reportJobId);
    const reportLoading = useMapStore((s) => s.reportLoading);
    const setReportLoading = useMapStore((s) => s.setReportLoading);
    const setReportJobId = useMapStore((s) => s.setReportJobId);
    const setCachedReport = useMapStore((s) => s.setCachedReport);
    const cachedReport = useMapStore((s) => s.cachedReport);
    const reportLayerVisible = useMapStore((s) => s.reportLayerVisible);
    const setReportLayerVisible = useMapStore((s) => s.setReportLayerVisible);
    const setReportLayerData = useMapStore((s) => s.setReportLayerData);
    const reportRankingMode = useMapStore((s) => s.reportRankingMode);
    const setReportRankingMode = useMapStore((s) => s.setReportRankingMode);
    const [reportLayerMessage, setReportLayerMessage] = useState<string | null>(null);
    const [thresholds, setThresholds] = useState(DEFAULT_SUITABILITY_THRESHOLDS);

    // Keep a ref to the interval so we can clear it from within the async callback.
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!reportJobId) return;

        const poll = async () => {
            try {
                const res = await fetch(`/api/ui/location/report/${reportJobId}`);

                if (res.status === 202) {
                    // Still pending — keep polling.
                    return;
                }

                // Either complete or error — stop polling regardless.
                if (intervalRef.current !== null) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                setReportJobId(null);
                setReportLoading(false);

                if (res.ok) {
                    const { report } = await res.json();
                    setCachedReport(report);
                } else {
                    console.error(`[ReportButton] Report job failed (${res.status})`);
                }
            } catch (err) {
                console.error('[ReportButton] Polling error:', err);
                if (intervalRef.current !== null) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                setReportJobId(null);
                setReportLoading(false);
            }
        };

        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [reportJobId, setCachedReport, setReportJobId, setReportLoading]);

    useEffect(() => {
        let mounted = true;

        loadSuitabilityThresholds().then((loaded) => {
            if (mounted) setThresholds(loaded);
        });

        return () => {
            mounted = false;
        };
    }, []);

    const openReportPage = () => {
        window.open('/report', '_blank', 'noopener,noreferrer');
    };

    const loadReportFromStorage = (): ReportDTO | null => {
        try {
            const raw = localStorage.getItem(CACHED_REPORT_STORAGE_KEY);
            return raw ? (JSON.parse(raw) as ReportDTO) : null;
        } catch {
            return null;
        }
    };

    const handleReportLayerToggle = () => {
        if (reportLayerVisible) {
            setReportLayerVisible(false);
            setReportLayerData(null);
            setReportLayerMessage(null);
            return;
        }

        const reportToUse = cachedReport ?? loadReportFromStorage();
        if (!reportToUse) {
            setReportLayerMessage('Report data is unavailable. Please generate the report first.');
            return;
        }

        setCachedReport(reportToUse);
        setReportLayerData(mapReportToLayerFeatureCollection(reportToUse, reportRankingMode, thresholds));
        setReportLayerVisible(true);
        setReportLayerMessage(null);
    };

    const handleRankingModeToggle = () => {
        const nextMode = reportRankingMode === 'weighted' ? 'legacyIssueCount' : 'weighted';
        setReportRankingMode(nextMode);

        if (!reportLayerVisible) return;

        const reportToUse = cachedReport ?? loadReportFromStorage();
        if (!reportToUse) return;

        setReportLayerData(mapReportToLayerFeatureCollection(reportToUse, nextMode, thresholds));
    };

    const isActive = reportLayerVisible;
    const toggleLayerLabel = reportLayerVisible ? 'Show model layer' : 'Show report layer';
    const toggleLayerIcon = reportLayerVisible ? '/icons/report_layer.svg' : '/icons/model_layer.svg';
    const rankingModeLabel = reportRankingMode === 'weighted' ? 'Ranking: weighted' : 'Ranking: legacy';

    if (!cachedHeatmap) return null;

    return (
        <StyledContainer style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <ControlButton onClick={openReportPage} aria-label="Report" disabled={reportLoading}>
                    <span style={{ marginRight: '8px' }}>Report</span>
                    {reportLoading ? (
                        <CircularProgress size={18} color="inherit" />
                    ) : (
                        <img src={'/icons/report_black.svg'} alt="Report" width={18} height={18} />
                    )}
                </ControlButton>

                <ControlIcon onClick={handleReportLayerToggle} isActive={isActive} aria-label={toggleLayerLabel} showTooltip={true} disabled={reportLoading}>
                    <img src={toggleLayerIcon} alt={toggleLayerLabel} width={24} height={24} />
                </ControlIcon>
                <ControlButton onClick={handleRankingModeToggle} aria-label={rankingModeLabel} disabled={reportLoading}>
                    <span>{rankingModeLabel}</span>
                </ControlButton>
            </Box>

            {reportLayerMessage && (
                <Typography variant="caption" color="warning.main">
                    {reportLayerMessage}
                </Typography>
            )}
        </StyledContainer>
    );
};

export default ReportButton;
