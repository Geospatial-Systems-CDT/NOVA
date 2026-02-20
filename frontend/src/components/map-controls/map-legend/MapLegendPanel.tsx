// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, styled, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import ControlIcon from '../../../shared/control-icon/ControlIcon';

const StyledPanel = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    minWidth: '220px',
    padding: theme.spacing(2),
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
}));

const LegendTitle = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(1),
}));

const LegendSubtitle = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
}));

const LegendItem = styled(Box)(({ theme }) => ({
    alignItems: 'center',
    display: 'flex',
    marginBottom: theme.spacing(1),
}));

const ColorLine = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>(({ color, theme }) => ({
    backgroundColor: color,
    height: '4px',
    marginRight: theme.spacing(1),
    width: '2rem',
}));

interface MapLegendPanelProps {
    mapRef: React.RefObject<MapRef>;
    isOpen: boolean;
    onToggle: () => void;
}

const MapLegendPanel = ({ mapRef, isOpen, onToggle }: MapLegendPanelProps) => {
    const [isHeatmapPresent, setIsHeatmapPresent] = useState(false);

    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const checkLayer = () => {
            const hasHeatmap = !!map.getLayer('heatmap-layer');
            setIsHeatmapPresent(hasHeatmap);
        };

        map.on('styledata', checkLayer);
        checkLayer();

        return () => {
            map.off('styledata', checkLayer);
        };
    }, [mapRef]);

    if (!isHeatmapPresent) return null;

    return (
        <div style={{ position: 'relative' }}>
            <ControlIcon onClick={onToggle} aria-label="Show map legend" aria-expanded={isOpen} aria-controls="map-legend-panel" isActive={isOpen}>
                <img src={isOpen ? '/icons/legend-white.svg' : '/icons/legend.svg'} alt="Legend" width={24} height={24} />
            </ControlIcon>

            {isOpen && (
                <StyledPanel id="map-legend-panel" role="dialog" aria-label="Map legend" style={{ right: 'calc(100% + 1rem)' }}>
                    <LegendTitle variant="subtitle1">Legend</LegendTitle>
                    <LegendSubtitle variant="subtitle2">Location suitability</LegendSubtitle>
                    <LegendItem>
                        <ColorLine color="#4CAF50" data-testid="color-line" />
                        <span>Most suitable</span>
                    </LegendItem>
                    <LegendItem>
                        <ColorLine color="#FF9800" data-testid="color-line" />
                        <span>Moderate suitability</span>
                    </LegendItem>
                    <LegendItem>
                        <ColorLine color="#F44336" data-testid="color-line" />
                        <span>Least suitable</span>
                    </LegendItem>
                </StyledPanel>
            )}
        </div>
    );
};

export default MapLegendPanel;
