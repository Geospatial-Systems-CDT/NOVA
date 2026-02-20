// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import ControlIcon from '../../../shared/control-icon/ControlIcon';
import { useMapStore } from '../../../stores/useMapStore';

interface DrawPolygonButtonProps {
    startPolygonDraw: () => void;
}

const DrawPolygonButton = ({ startPolygonDraw }: DrawPolygonButtonProps) => {
    const polygonStatus = useMapStore((s) => s.polygonStatus);

    const isVisible = polygonStatus === 'none' || polygonStatus === 'drawing' || polygonStatus === 'pendingConfirmation';
    const isActive = polygonStatus === 'drawing' || polygonStatus === 'pendingConfirmation';

    const handleClick = () => {
        startPolygonDraw();
    };

    if (!isVisible) return null;

    return (
        <ControlIcon onClick={handleClick} isActive={isActive} aria-label="Draw polygon" aria-pressed={isActive} showTooltip={true}>
            <img src={isActive ? '/icons/polygon-white.svg' : '/icons/polygon.svg'} alt="Draw polygon icon" width={24} height={24} />
        </ControlIcon>
    );
};

export default DrawPolygonButton;
