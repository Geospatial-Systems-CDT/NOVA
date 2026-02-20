// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import AssetMarker from './AssetMarker';
import { useMapStore } from '../../stores/useMapStore';

interface Props {
    is3D: boolean;
    setIsPanelOpen?: (isPanelOpen: boolean) => void;
}

const AssetMarkerContainer = ({ is3D, setIsPanelOpen }: Props) => {
    const markerPosition = useMapStore((s) => s.markerPosition);
    if (!markerPosition || is3D) return null;

    return <AssetMarker longitude={markerPosition.longitude} latitude={markerPosition.latitude} setIsPanelOpen={setIsPanelOpen} />;
};

export default AssetMarkerContainer;
