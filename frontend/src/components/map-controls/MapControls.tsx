// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, styled } from '@mui/material';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapStyle } from '../../types/map';
import CompassButton from './compass/CompassButton';
import MapLegendPanel from './map-legend/MapLegendPanel';
import MapStylePanel from './map-style/MapStylePanel';
import ViewToggleButton from './view-toggle/ViewToggleButton';
import ZoomInButton from './zoom-in/ZoomInButton';
import ZoomOutButton from './zoom-out/ZoomOutButton';
import { useState } from 'react';

const ControlsContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'absolute',
    right: '1rem',
    top: '1rem',
    zIndex: 1,
});

const ControlGroup = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    display: 'flex',
    flexDirection: 'column',
}));

const ControlDivider = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.divider,
    height: 2,
    width: '100%',
}));

interface MapControlsProps {
    mapRef: React.RefObject<MapRef>;
    currentStyle: MapStyle;
    is3D: boolean;
    onStyleChange: (style: MapStyle) => void;
    setIs3D: (is3d: boolean) => void;
}

const MapControls = ({ mapRef, onStyleChange, currentStyle, is3D, setIs3D }: MapControlsProps) => {
    const [openPanel, setOpenPanel] = useState<'style' | 'legend' | null>(null);

    return (
        <ControlsContainer>
            <ControlGroup role="group" aria-label="View controls">
                <CompassButton mapRef={mapRef} />
                <ControlDivider />
                <ViewToggleButton mapRef={mapRef} onStyleChange={onStyleChange} is3D={is3D} setIs3D={setIs3D} currentStyle={currentStyle} />
            </ControlGroup>

            <ControlGroup role="group" aria-label="Zoom controls">
                <ZoomInButton mapRef={mapRef} />
                <ControlDivider />
                <ZoomOutButton mapRef={mapRef} />
            </ControlGroup>

            <ControlGroup role="group" aria-label="Map style controls">
                <MapStylePanel
                    currentStyle={currentStyle}
                    onStyleChange={onStyleChange}
                    isOpen={openPanel === 'style'}
                    onToggle={() => setOpenPanel((prev) => (prev === 'style' ? null : 'style'))}
                />
            </ControlGroup>

            <ControlGroup role="group" aria-label="Map legend controls">
                <MapLegendPanel
                    mapRef={mapRef}
                    isOpen={openPanel === 'legend'}
                    onToggle={() => setOpenPanel((prev) => (prev === 'legend' ? null : 'legend'))}
                />
            </ControlGroup>
        </ControlsContainer>
    );
};

export default MapControls;
