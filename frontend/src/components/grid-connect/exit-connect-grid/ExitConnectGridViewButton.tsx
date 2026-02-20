// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, styled } from '@mui/material';
import ControlButton from '../../../shared/control-button/ControlButton';
import { useMapStore } from '../../../stores/useMapStore';
import { MapVisualHelper } from '../../../utils/MapVisualHelper';
import { MarkerStatus } from '../../asset-marker/AssetMarkerStatus';

const StyledContainer = styled(Box)({
    position: 'relative',
});

const ExitConnectGridViewButton = () => {
    const setGridConnectViewActive = useMapStore((s) => s.setGridConnectViewActive);
    const markerPosition = useMapStore((s) => s.markerPosition);
    const setMarkerStatus = useMapStore((s) => s.setMarkerStatus);
    const mapRef = useMapStore((s) => s.mapRef);
    const drawRef = useMapStore((s) => s.drawRef);

    const exitGridConnectView = () => {
        setGridConnectViewActive(false);
        setMarkerStatus(MarkerStatus.Final);
        MapVisualHelper.removeGridLayers();
        if (markerPosition && mapRef && drawRef) {
            MapVisualHelper.panToPolygon(mapRef.getMap(), drawRef);
        }
    };

    return (
        <StyledContainer>
            <ControlButton onClick={exitGridConnectView} aria-label="Exit grid connection view">
                <span style={{ marginRight: '8px', color: '#e60000', fontWeight: 'bold' }}>Exit grid connection view</span>
                <img src="/icons/delete-polygon.svg" alt="Exit icon" width={24} height={24} />
            </ControlButton>
        </StyledContainer>
    );
};

export default ExitConnectGridViewButton;
