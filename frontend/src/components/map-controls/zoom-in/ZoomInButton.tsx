// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { MapRef } from 'react-map-gl/maplibre';
import ControlIcon from '../../../shared/control-icon/ControlIcon';

interface ZoomInButtonProps {
    mapRef: React.RefObject<MapRef>;
}

const ZoomInButton = ({ mapRef }: ZoomInButtonProps) => {
    const handleClick = () => {
        const map = mapRef.current?.getMap();
        if (map) {
            map.zoomIn({ duration: 300 });
        }
    };

    return (
        <ControlIcon onClick={handleClick} aria-label="Zoom In">
            <img src="/icons/add.svg" alt="Zoom in" width={24} height={24} />
        </ControlIcon>
    );
};

export default ZoomInButton;
