// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { MapRef } from 'react-map-gl/maplibre';
import ControlIcon from '../../../shared/control-icon/ControlIcon';

interface ZoomOutButtonProps {
    mapRef: React.RefObject<MapRef>;
}

const ZoomOutButton = ({ mapRef }: ZoomOutButtonProps) => {
    const handleClick = () => {
        const map = mapRef.current?.getMap();
        if (map) {
            map.zoomOut({ duration: 300 });
        }
    };

    return (
        <ControlIcon onClick={handleClick} aria-label="Zoom Out">
            <img src="/icons/remove.svg" alt="Zoom out" width={24} height={24} />
        </ControlIcon>
    );
};

export default ZoomOutButton;
