// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import ControlIcon from '../../../shared/control-icon/ControlIcon';
import { useMapStore } from '../../../stores/useMapStore';

interface DeletePolygonButtonProps {
    deletePolygon: () => void;
}

const DeletePolygonButton = ({ deletePolygon }: DeletePolygonButtonProps) => {
    const polygonStatus = useMapStore((s) => s.polygonStatus);
    const isVisible = polygonStatus === 'drawing' || polygonStatus === 'pendingConfirmation' || polygonStatus === 'editing' || polygonStatus === 'confirmed';

    if (!isVisible) return null;

    return (
        <ControlIcon onClick={deletePolygon} aria-label="Delete polygon" showTooltip={true}>
            <img src="/icons/delete-polygon.svg" alt="Delete polygon icon" width={24} height={24} />
        </ControlIcon>
    );
};

export default DeletePolygonButton;
