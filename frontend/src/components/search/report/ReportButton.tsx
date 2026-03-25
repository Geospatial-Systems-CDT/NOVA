// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, CircularProgress, styled } from '@mui/material';
import ControlButton from '../../../shared/control-button/ControlButton';
import { useMapStore } from '../../../stores/useMapStore';
import { useEffect, useRef } from 'react';

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

    const openReportPage = () => {
        window.open('/report', '_blank', 'noopener,noreferrer');
    };

    if (!cachedHeatmap) return null;

    return (
        <StyledContainer style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <ControlButton
                onClick={openReportPage}
                aria-label="Report"
                disabled={reportLoading}
            >
                <span style={{ marginRight: '8px' }}>Report</span>
                {reportLoading ? (
                    <CircularProgress size={18} color="inherit" />
                ) : (
                    <img src={'/icons/report_black.svg'} alt="Report" width={18} height={18} />
                )}
            </ControlButton>
        </StyledContainer>
    );
};

export default ReportButton;

