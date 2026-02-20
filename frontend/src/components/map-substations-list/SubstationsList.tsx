// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import React, { useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Button, Paper, Typography, Divider } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';

export interface Substation {
    id: number;
    name: string;
    distanceFromTurbine: string;
    coordinates: number[];
}

interface SubstationsListProps {
    items?: Substation[];
    onConfirm?: (selectedItem: Substation) => void;
}

/**
 * A component that displays a list of substations with a confirmation button.
 */
const SubstationsList: React.FC<SubstationsListProps> = ({ items = [], onConfirm = () => console.log('Confirmed') }) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleItemClick = (index: number) => {
        setSelectedIndex(index);
    };

    const handleConfirm = () => {
        if (selectedIndex !== null) {
            onConfirm(items[selectedIndex]);
        }
    };

    return (
        <Paper elevation={5} sx={{ maxWidth: 600, borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'left', p: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5 }}>
                    <BoltIcon />
                </ListItemIcon>
                <Typography variant="subtitle1" fontWeight="bold">
                    Choose Substation
                </Typography>
            </Box>

            <List sx={{ height: '200', overflow: 'auto' }}>
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        <ListItem disablePadding>
                            <ListItemButton selected={selectedIndex === index} onClick={() => handleItemClick(index)} sx={{ py: 0.5, px: 1 }}>
                                <ListItemText
                                    primary={item.name}
                                    secondary={`Distance: ${item.distanceFromTurbine}km`}
                                    sx={{
                                        my: 0,
                                        ml: 0,
                                        '& .MuiListItemText-primary': { fontSize: 'smaller' },
                                        '& .MuiListItemText-secondary': { fontSize: 'smaller' },
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                        {index < items.length - 1 && <Divider sx={{ my: 0 }} />}
                    </React.Fragment>
                ))}
            </List>

            <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button variant="contained" onClick={handleConfirm} disabled={selectedIndex === null} size="medium">
                    Confirm
                </Button>
            </Box>
        </Paper>
    );
};

export default SubstationsList;
