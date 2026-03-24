// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Box, Divider, styled } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { type MapRef } from 'react-map-gl/maplibre';
import { usePolygonHandlers } from '../../hooks/usePolygonHandlers';
import { useMapStore } from '../../stores/useMapStore';
import { MapVisualHelper } from '../../utils/MapVisualHelper';
import AddAssetButton from './add-asset/AddAssetButton';
import ReportButton from './report/ReportButton';
import DeletePolygonButton from './delete-polygon/DeletePolygonButton';
import DrawPolygonButton from './draw-polygon/DrawPolygonButton';
import EditPolygonButton from './edit-polygon/EditPolygonButton';
import HideLayersButton from './hide-map-layers/HideLayersButton';
import SearchInput from './search-input/SearchInput';

const SearchContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    left: '1rem',
    position: 'absolute',
    top: '1rem',
    zIndex: 1,
});

const SearchGroup = styled(Box)(({ theme }) => ({
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
}));

const VerticalDivider = styled(Divider)(({ theme }) => ({
    backgroundColor: theme.palette.divider,
    width: 2,
}));

interface SearchPanelProps {
    drawRef: React.RefObject<MapboxDraw | null>;
    mapRef: React.RefObject<MapRef>;
    isPanelOpen: boolean;
    setIsPanelOpen: (isPanelOpen: boolean) => void;
    onPolygonDeleted: () => void;
}

const SearchPanel = ({ drawRef, mapRef, isPanelOpen, setIsPanelOpen, onPolygonDeleted }: SearchPanelProps) => {
    const cachedHeatmap = useMapStore((s) => s.cachedHeatmap);
    const polygonStatus = useMapStore((s) => s.polygonStatus);

    const { handlePolygonDeleted: baseDelete, startPolygonDraw, startPolygonEdit } = usePolygonHandlers({ mapRef, drawRef });

    const handleLocationSelect = useCallback((lat: number, long: number, zoom: number) => {
        MapVisualHelper.flyToLocation(lat, long, zoom);
    }, []);

    const handleDeleteAndReset = useCallback(() => {
        baseDelete();
        onPolygonDeleted();
    }, [baseDelete, onPolygonDeleted]);

    const drawingControls = useMemo(() => {
        const controls = [
            {
                component: <DrawPolygonButton key="draw" startPolygonDraw={startPolygonDraw} />,
                visible: polygonStatus === 'none' || polygonStatus === 'drawing' || polygonStatus === 'pendingConfirmation',
            },
            {
                component: <DeletePolygonButton key="delete" deletePolygon={handleDeleteAndReset} />,
                visible: polygonStatus === 'drawing' || polygonStatus === 'pendingConfirmation' || polygonStatus === 'editing' || polygonStatus === 'confirmed',
            },
            {
                component: <EditPolygonButton key="edit" startPolygonEdit={startPolygonEdit} />,
                visible: polygonStatus === 'confirmed' || polygonStatus === 'editing',
            },
            {
                component: <HideLayersButton key="hide" mapRef={mapRef} cachedHeatmap={cachedHeatmap} />,
                visible: !!cachedHeatmap,
            },
        ];

        const visibleControls = controls.filter((control) => control.visible);

        const controlsWithDividers: React.ReactNode[] = [];
        visibleControls.forEach((control, index) => {
            if (index > 0) {
                controlsWithDividers.push(<VerticalDivider key={`divider-${index}`} orientation="vertical" />);
            }
            controlsWithDividers.push(control.component);
        });

        return controlsWithDividers;
    }, [startPolygonDraw, handleDeleteAndReset, startPolygonEdit, mapRef, cachedHeatmap, polygonStatus]);

    return (
        <SearchContainer>
            <SearchGroup role="group" aria-label="Search controls" sx={{ minWidth: 400 }}>
                <SearchInput onSearchResultClick={handleLocationSelect} />
            </SearchGroup>

            <SearchGroup role="group" aria-label="Drawing controls">
                {drawingControls}
            </SearchGroup>

            <SearchGroup>
                <AddAssetButton isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} />
            </SearchGroup>

            <SearchGroup>
                <ReportButton />
            </SearchGroup>            
        </SearchContainer>
    );
};

export default SearchPanel;
