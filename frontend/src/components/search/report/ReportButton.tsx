// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, styled } from '@mui/material';
import ControlButton from '../../../shared/control-button/ControlButton';
import ReportPanel from './ReportPanel';
import { useMapStore } from '../../../stores/useMapStore';
import { useState } from 'react';

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

const ReportButton = ( ) => {
    const cachedHeatmap = useMapStore((s) => s.cachedHeatmap);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const handleTogglePanel = () => {
        setIsReportOpen(!isReportOpen);
    };

    const handleClosePanel = () => {
        setIsReportOpen(false);
    };

    if (!cachedHeatmap) return null;

    return (
        <StyledContainer style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <ControlButton
                onClick={handleTogglePanel}
                aria-label="Report"
                isActive={isReportOpen}
            >
                <span style={{ marginRight: '8px' }}>Report</span>
                {/* Fallback to add.svg icon for now */}
                <img src={isReportOpen ? '/icons/report_white.svg' : '/icons/report_black.svg'} alt="Report" width={18} height={18} />
            </ControlButton>
            {isReportOpen && <ReportPanel onClose={handleClosePanel} onSelect={() => {}} />}
        </StyledContainer>
    );
};

export default ReportButton;
