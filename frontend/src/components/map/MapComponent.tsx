// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { Map } from 'react-map-gl/maplibre';
import GridConnectPanel from '../grid-connect/GridConnectPanel';
import { INITIAL_MAP_LATITUDE, INITIAL_MAP_LONGITUDE, INITIAL_MAP_ZOOM, MAP_STYLES, type MapStyle } from '../../types/map';
import GridConnectFooterPanel from '../grid-connect/GridConnectFooterPanel';
import MapControls from '../map-controls/MapControls';
import SearchPanel from '../search/SearchPanel';
import LayerControlPanel from '../layer-selection/LayerControlPanel';
import ScenarioPanel from '../layer-selection/ScenarioPanel';
import useMapboxDraw from '../../hooks/useMapboxDraw';
import { MapVisualHelper } from '../../utils/MapVisualHelper';
import { useMapStore } from '../../stores/useMapStore';
import AssetMarkerContainer from '../asset-marker/AssetMarkerContainer';
import { useMarkerPlacement } from '../../hooks/useMarkerPlacement';
import PlacingMarkerOverlay from '../asset-marker/PlacingMarkerOverlay';

const MAP_VIEW_BOUNDS: [[number, number], [number, number]] = [
    [-25.0, 42.0],
    [15.0, 67.0],
];

const MapComponent = () => {
    const renderStartRef = useRef(performance.now());
    const mapInitLoggedRef = useRef(false);
    const planningControlsLoggedRef = useRef(false);
    const scenarioPanelLoggedRef = useRef(false);
    const layersPanelLoggedRef = useRef(false);
    const mapRef = useRef<MapRef>(null!);
    const setMapRef = useMapStore((s) => s.setMapRef);
    const [viewState, setViewState] = useState({
        longitude: INITIAL_MAP_LONGITUDE,
        latitude: INITIAL_MAP_LATITUDE,
        zoom: INITIAL_MAP_ZOOM,
        pitch: 0,
        bearing: 0,
    });
    const [mapStyle, setMapStyle] = useState<MapStyle>('hybrid');
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const placing = useMapStore((s) => s.placing);
    const gridConnectViewActive = useMapStore((s) => s.gridConnectViewActive);
    const selectedSubstation = useMapStore((s) => s.selectedSubstation);

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const drawRef = useMapboxDraw(mapRef, isMapInitialized);
    const setDrawRef = useMapStore((s) => s.setDrawRef);
    const [is3D, setIs3D] = useState(false);
    const cachedHeatMap = useMapStore((s) => s.cachedHeatmap);
    const polygonStatus = useMapStore((s) => s.polygonStatus);
    const showPlanningControls = polygonStatus === 'confirmed';
    const planningMode = useMapStore((s) => s.planningMode);
    const setPlanningMode = useMapStore((s) => s.setPlanningMode);
    const { handleMapClick, mousePos, isInsidePolygon, suitability } = useMarkerPlacement();
    const [resetLayers, setResetLayers] = useState(false);

    const handleStyleChange = (newStyle: MapStyle) => {
        setMapStyle(newStyle);
        const userDrawnPolygon = drawRef.current ? MapVisualHelper.getFirstPolygon(drawRef.current) : null;
        if (mapRef.current && userDrawnPolygon && cachedHeatMap) {
            mapRef.current.getMap().once('styledata', () => {
                MapVisualHelper.addOrUpdateHeatmapLayer(mapRef, cachedHeatMap);
                MapVisualHelper.applyDimmedMaskAndPanToPolygon(mapRef.current.getMap(), userDrawnPolygon);
            });
        }
    };

    useEffect(() => {
        if (drawRef.current) {
            setDrawRef(drawRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawRef.current, setDrawRef]);

    useEffect(() => {
        if (isMapInitialized && !mapInitLoggedRef.current) {
            mapInitLoggedRef.current = true;
            console.info(`[perf] map initialized in ${(performance.now() - renderStartRef.current).toFixed(2)}ms`);
        }
    }, [isMapInitialized]);

    useEffect(() => {
        if (showPlanningControls && !planningControlsLoggedRef.current) {
            planningControlsLoggedRef.current = true;
            console.info(`[perf] planning controls shown in ${(performance.now() - renderStartRef.current).toFixed(2)}ms`);
        }
    }, [showPlanningControls]);

    useEffect(() => {
        if (showPlanningControls && planningMode === 'scenarios' && !scenarioPanelLoggedRef.current) {
            scenarioPanelLoggedRef.current = true;
            console.info(`[perf] scenarios panel first shown in ${(performance.now() - renderStartRef.current).toFixed(2)}ms`);
        }
    }, [planningMode, showPlanningControls]);

    useEffect(() => {
        if (showPlanningControls && planningMode === 'layers' && !layersPanelLoggedRef.current) {
            layersPanelLoggedRef.current = true;
            console.info(`[perf] layers panel first shown in ${(performance.now() - renderStartRef.current).toFixed(2)}ms`);
        }
    }, [planningMode, showPlanningControls]);

    const handleMapLoad = () => {
        setIsMapInitialized(true);
        setMapRef(mapRef.current);
    };

    const handlePolygonDeleted = () => {
        setResetLayers(true);
    };

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Map
                ref={mapRef}
                maxBounds={MAP_VIEW_BOUNDS}
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                onClick={handleMapClick}
                onLoad={handleMapLoad}
                mapStyle={MAP_STYLES[mapStyle]}
                style={{ width: '100%', height: '100%' }}
            >
                {isMapInitialized && (
                    <>
                        <SearchPanel
                            drawRef={drawRef}
                            isPanelOpen={isPanelOpen}
                            mapRef={mapRef}
                            setIsPanelOpen={setIsPanelOpen}
                            onPolygonDeleted={handlePolygonDeleted}
                        />
                        {gridConnectViewActive && <GridConnectPanel />}
                        <MapControls mapRef={mapRef} onStyleChange={handleStyleChange} currentStyle={mapStyle} is3D={is3D} setIs3D={setIs3D} />
                        {showPlanningControls && (
                            <Paper
                                elevation={4}
                                sx={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    left: '1rem',
                                    zIndex: 1002,
                                    p: 0.5,
                                }}
                            >
                                <ToggleButtonGroup
                                    exclusive
                                    size="small"
                                    value={planningMode}
                                    onChange={(_, mode) => {
                                        if (!mode) return;
                                        setPlanningMode(mode);
                                    }}
                                >
                                    <ToggleButton value="scenarios">Scenarios</ToggleButton>
                                    <ToggleButton value="layers">Layers</ToggleButton>
                                </ToggleButtonGroup>
                            </Paper>
                        )}
                        {placing && mousePos && <PlacingMarkerOverlay mousePos={mousePos} isInsidePolygon={isInsidePolygon} suitability={suitability} />}
                        <AssetMarkerContainer is3D={is3D} setIsPanelOpen={setIsPanelOpen} />
                        {planningMode === 'scenarios' ? (
                            <ScenarioPanel />
                        ) : (
                            <LayerControlPanel mapRef={mapRef} drawRef={drawRef} resetLayers={resetLayers} setResetLayers={setResetLayers} />
                        )}
                    </>
                )}
            </Map>
            {gridConnectViewActive && selectedSubstation && (
                <>
                    <GridConnectFooterPanel selectedSubstation={selectedSubstation} />
                </>
            )}
        </Box>
    );
};

export default MapComponent;
