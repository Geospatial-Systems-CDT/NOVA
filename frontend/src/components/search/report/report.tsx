// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, styled } from '@mui/material';
import ControlButton from '../../../shared/control-button/ControlButton';
import AddAssetPanel from './AddAssetPanel';
import { useMapStore } from '../../../stores/useMapStore';

const StyledContainer = styled(Box)({
    position: 'relative',
});

interface AddAssetButtonProps {
    isPanelOpen: boolean;
    setIsPanelOpen: (isPanelOpen: boolean) => void;
}

const AddAssetButton = ({ isPanelOpen, setIsPanelOpen }: AddAssetButtonProps) => {
    const setPlacing = useMapStore((s) => s.setPlacing);
    const setMarkerPosition = useMapStore((s) => s.setMarkerPosition);
    const markerPlaced = useMapStore((s) => s.markerPosition);
    const cachedHeatmap = useMapStore((s) => s.cachedHeatmap);

    const handleTogglePanel = () => {
        setIsPanelOpen(!isPanelOpen);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
    };

    const handleAssetSelect = () => {
        setPlacing(true);
        setIsPanelOpen(false);
        setMarkerPosition(null);
    };

    if (!cachedHeatmap) return null;

    if (markerPlaced && !isPanelOpen) return null;

    return (
        <StyledContainer style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <ControlButton
                onClick={handleTogglePanel}
                aria-label="Add asset"
                isActive={isPanelOpen}
                style={{ marginRight: '1rem' }}
            >
                <span style={{ marginRight: '8px' }}>Add asset</span>
                <img src={isPanelOpen ? '/icons/add-white.svg' : '/icons/add.svg'} alt="Add asset" width={18} height={18} />
            </ControlButton>
            {isPanelOpen && <AddAssetPanel onClose={handleClosePanel} onSelect={handleAssetSelect} />}
        </StyledContainer>
    );
};

export default AddAssetButton;
