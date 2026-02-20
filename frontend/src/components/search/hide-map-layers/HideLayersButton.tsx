// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { MapRef } from 'react-map-gl/maplibre';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import ControlIcon from '../../../shared/control-icon/ControlIcon';
import { MapVisualHelper } from '../../../utils/MapVisualHelper';
import { useState } from 'react';

interface HideLayersButtonProps {
    mapRef: React.RefObject<MapRef>;
    cachedHeatmap: FeatureCollection<Geometry, GeoJsonProperties> | null;
}

const HideLayersButton = ({ mapRef, cachedHeatmap }: HideLayersButtonProps) => {
    const [hiddenLayerIds, setHiddenLayerIds] = useState<string[] | null>(null);
    const [isActive, setIsActive] = useState(true);

    if (!cachedHeatmap) return null;

    const handleClick = () => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        setIsActive(!isActive);

        if (isActive) {
            const toHide = MapVisualHelper.hideNonBaseLayers(map);
            setHiddenLayerIds(toHide);
        } else {
            if (hiddenLayerIds) {
                MapVisualHelper.showLayers(map, hiddenLayerIds);
            }
        }
    };

    return (
        <ControlIcon onClick={handleClick} isActive={isActive} aria-label="Toggle polygon" showTooltip={true}>
            <img src={!isActive ? '/icons/hide-layers-white.svg' : '/icons/hide-layers.svg'} alt="Toggle layer visibility icon" width={24} height={24} />
        </ControlIcon>
    );
};

export default HideLayersButton;
