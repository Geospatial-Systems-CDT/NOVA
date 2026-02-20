// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import BoltIcon from '@mui/icons-material/Bolt';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import { Box, styled } from '@mui/material';
import ControlIcon from '../../shared/control-icon/ControlIcon';

const ControlsContainer = styled(Box)(() => ({
    position: 'absolute',
    top: '-70px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
    padding: '3px',
    zIndex: 1000,
}));

interface AssetControlsProps {
    onBoltClick: () => void;
    onDeleteClick: () => void;
    onEditClick: () => void;
    onMoveClick: () => void;
    isSubstationsListOpen?: boolean;
}

/**
 * A component for displaying control buttons for an asset marker
 */
const AssetControls: React.FC<AssetControlsProps> = ({ onBoltClick, onDeleteClick, onEditClick, onMoveClick, isSubstationsListOpen = false }) => {
    return (
        <ControlsContainer onClick={(e) => e.stopPropagation()}>
            <ControlIcon onClick={onEditClick} aria-label="Edit" showTooltip>
                <EditIcon />
            </ControlIcon>
            <ControlIcon onClick={onBoltClick} aria-label="Connect to grid" showTooltip isActive={isSubstationsListOpen}>
                <BoltIcon />
            </ControlIcon>
            <ControlIcon onClick={onDeleteClick} aria-label="Delete Asset" showTooltip>
                <DeleteForeverIcon />
            </ControlIcon>
            <ControlIcon onClick={onMoveClick} aria-label="Move" showTooltip>
                <OpenWithIcon />
            </ControlIcon>
        </ControlsContainer>
    );
};

export default AssetControls;
