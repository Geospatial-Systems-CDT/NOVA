// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, styled } from '@mui/material';
import ExitConnectGridViewButton from './exit-connect-grid/ExitConnectGridViewButton';
import SelectSubstationButton from './select-substation/SelectSubstationButton';

const PanelContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    right: '5rem',
    position: 'absolute',
    top: '1rem',
    zIndex: 1,
});

const GridConnectPanel = () => {
    return (
        <PanelContainer>
            <SelectSubstationButton />
            <ExitConnectGridViewButton />
        </PanelContainer>
    );
};

export default GridConnectPanel;
