// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import React, { useState, useEffect } from 'react';
import { Paper, Typography, CircularProgress } from '@mui/material';
import SubstationsList, { type Substation } from './SubstationsList';
import { fetchSubstations } from './substationsApi';
import { useMapStore } from '../../stores/useMapStore';
import { MapVisualHelper } from '../../utils/MapVisualHelper';
import { MarkerStatus } from '../asset-marker/AssetMarkerStatus';

interface SubstationsListContainerProps {
    setShowSubstationsList: (showSubstationsList: boolean) => void;
    setShowControls?: (showControls: boolean) => void;
}

/**
 * A container component that handles loading substations data and displays
 * the SubstationsList with appropriate loading and error states.
 */
const SubstationsListContainer: React.FC<SubstationsListContainerProps> = ({ setShowSubstationsList, setShowControls }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const substations = useMapStore((s) => s.substations);
    const setSubstations = useMapStore((s) => s.setSubstations);
    const setGridConnectViewActive = useMapStore((s) => s.setGridConnectViewActive);
    const gridConnectViewActive = useMapStore((s) => s.gridConnectViewActive);
    const setShowLayerControl = useMapStore((s) => s.setShowLayerControl);
    const setSelectedSubstation = useMapStore((s) => s.setSelectedSubstation);
    const setMarkerStatus = useMapStore((s) => s.setMarkerStatus);
    const markerPosition = useMapStore((s) => s.markerPosition);

    const onSubstationSelection = (selected: Substation) => {
        console.log(`Selected substation: ${selected.name}`);
        setSelectedSubstation(selected);
        setGridConnectViewActive(true);
        if (!gridConnectViewActive && setShowControls) setShowControls(false);
        setMarkerStatus(MarkerStatus.Connecting);
        setShowLayerControl(false);
        setShowSubstationsList(false);
        MapVisualHelper.renderSubstationAndPowerLineLayers();
        MapVisualHelper.renderGridConnectionLine();
        if (markerPosition && markerPosition.latitude && markerPosition.longitude)
            MapVisualHelper.flyToLocation(markerPosition.latitude, markerPosition.longitude, 10);
    };

    useEffect(() => {
        const loadSubstations = async () => {
            if (!markerPosition || !markerPosition.latitude || !markerPosition.longitude) return;

            setIsLoading(true);
            setError(null);

            try {
                const result = await fetchSubstations(markerPosition.longitude, markerPosition.latitude);
                setSubstations(result.items);
                setError(result.error);
            } catch (err) {
                console.error('Error fetching substations:', err);
                setError('Failed to load substations');
            } finally {
                setIsLoading(false);
            }
        };

        loadSubstations();
    }, [markerPosition, setSubstations]);

    if (isLoading) {
        return (
            <Paper elevation={5} sx={{ maxWidth: 600, borderRadius: 1, p: 2, textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2">Loading substations...</Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper elevation={5} sx={{ maxWidth: 600, borderRadius: 1, p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="error">
                    {error}
                </Typography>
            </Paper>
        );
    }

    return <SubstationsList items={substations} onConfirm={onSubstationSelection} />;
};

export default SubstationsListContainer;
