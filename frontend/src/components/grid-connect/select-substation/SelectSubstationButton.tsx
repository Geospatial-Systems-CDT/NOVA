// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, MenuItem, Select, styled } from '@mui/material';
import { useMapStore } from '../../../stores/useMapStore';
import { MapVisualHelper } from '../../../utils/MapVisualHelper';

const SelectSubstationButton = () => {
    const selected = useMapStore((s) => s.selectedSubstation);
    const setSelectedSubstationById = useMapStore((s) => s.setSelectedSubstationById);
    const substations = useMapStore((s) => s.substations);

    const GridConnectMenuGroup = styled(Box)(({ theme }) => ({
        alignItems: 'center',
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[2],
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
    }));

    const GridConnectSelect = styled(Select)(({ theme }) => ({
        minWidth: 200,
        height: 48,
        minHeight: 48,
        fontWeight: 600,
        fontSize: 14,
        color: '#1a2233',
        bgcolor: 'transparent',
        border: 'none',
        '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
            inset: 0,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            outline: '4px solid',
            outlineColor: theme.palette.secondary.dark,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            outline: '4px solid',
            outlineColor: theme.palette.secondary.main,
        },
    }));

    const handleSubstationChange = (id: number) => {
        setSelectedSubstationById(id);
        MapVisualHelper.renderGridConnectionLine();
    };

    return (
        <GridConnectMenuGroup role="group" aria-label="Substation selection">
            <GridConnectSelect
                value={selected?.id}
                onChange={(e) => handleSubstationChange(e.target.value as number)}
                displayEmpty
                MenuProps={{ slotProps: { paper: { sx: { marginTop: 1 } } } }}
            >
                {substations.map((s) => (
                    <MenuItem key={s.name} value={s.id}>
                        {s.name} ({s.distanceFromTurbine}km)
                    </MenuItem>
                ))}
            </GridConnectSelect>
        </GridConnectMenuGroup>
    );
};

export default SelectSubstationButton;
