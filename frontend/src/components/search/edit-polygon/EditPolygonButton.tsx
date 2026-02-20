// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import ControlIcon from '../../../shared/control-icon/ControlIcon';
import { useMapStore } from '../../../stores/useMapStore';

interface EditPolygonButtonProps {
    startPolygonEdit: () => void;
}

const EditPolygonButton = ({ startPolygonEdit }: EditPolygonButtonProps) => {
    const polygonStatus = useMapStore((s) => s.polygonStatus);
    const isVisible = polygonStatus === 'confirmed' || polygonStatus === 'editing';

    if (!isVisible) return null;

    return (
        <ControlIcon onClick={startPolygonEdit} aria-label="Edit polygon" showTooltip={true}>
            <img src="/icons/edit-polygon.svg" alt="Edit polygon icon" width={24} height={24} />
        </ControlIcon>
    );
};

export default EditPolygonButton;
