// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, styled } from '@mui/material';

const GridConnectMenuContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    position: 'absolute',
    top: '1rem',
    right: '5rem',
    zIndex: 1200,
});

const GridConnectMenuGroup = styled(Box)(({ theme }) => ({
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
}));

export default function GridConnectMenuPanel() {
    return (
        <GridConnectMenuContainer>
            <GridConnectMenuGroup role="group" aria-label="Substation selection"></GridConnectMenuGroup>
        </GridConnectMenuContainer>
    );
}
