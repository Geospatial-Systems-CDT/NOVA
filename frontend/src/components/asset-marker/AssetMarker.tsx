// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useRef, useState } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import selected_turbine_icon from '../../assets/Windturbine_blue_selected.svg';
import unselected_turbine_icon from '../../assets/Windturbine_blue_unselected.svg';
import white_turbine_icon from '../../assets/white_turbine.svg';
import { useMapStore } from '../../stores/useMapStore';
import { SubstationsListContainer } from '../map-substations-list';
import AssetControls from './AssetControls';
import { MarkerStatus } from './AssetMarkerStatus';
import AssetSpecificationPopup from './AssetSpecificationPopup';

interface AssetMarkerProps {
    longitude?: number;
    latitude?: number;
    onClick?: () => void;
    onBoltClick?: () => void;
    setIsPanelOpen?: (isPanelOpen: boolean) => void;
}

const AssetMarker: React.FC<AssetMarkerProps> = ({ longitude, latitude, onBoltClick, setIsPanelOpen }) => {
    const markerRef = useRef<HTMLDivElement>(null);
    const [hasOpened, setHasOpened] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [showSubstationsList, setShowSubstationsList] = useState(false);

    const setPlacing = useMapStore((s) => s.setPlacing);
    const setMarkerPosition = useMapStore((s) => s.setMarkerPosition);
    const markerStatus = useMapStore((s) => s.markerStatus);

    const handleMarkerClick = (e: React.MouseEvent<HTMLImageElement>) => {
        e.preventDefault();
        setShowControls((v) => !v);
    };

    if (longitude === undefined || latitude === undefined) return null;

    if (!hasOpened) {
        setHasOpened(true);
        setShowControls(true);
    }

    const getMarkerImg = () => {
        if (markerStatus === MarkerStatus.Connecting) return white_turbine_icon;
        return showControls ? selected_turbine_icon : unselected_turbine_icon;
    };

    const getMarkerSize = () => {
        if (markerStatus === MarkerStatus.Connecting) {
            return 100;
        } else {
            return 60;
        }
    };

    return (
        <Marker longitude={longitude} latitude={latitude} anchor="bottom" draggable={false}>
            <div ref={markerRef} style={{ position: 'relative' }}>
                {showPopup && <AssetSpecificationPopup />}
                {showControls && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <AssetControls
                            onBoltClick={() => {
                                setShowSubstationsList((prev) => !prev);
                                if (onBoltClick) onBoltClick();
                            }}
                            onDeleteClick={() => {
                                if (setMarkerPosition) setMarkerPosition(null);
                            }}
                            onEditClick={() => {
                                if (setIsPanelOpen) setIsPanelOpen(true);
                            }}
                            onMoveClick={() => {
                                if (setMarkerPosition) setMarkerPosition(null);
                                if (setPlacing) setPlacing(true);
                            }}
                            isSubstationsListOpen={showSubstationsList}
                        />
                    </div>
                )}
                {showSubstationsList && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-320px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1000,
                            width: '250px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <SubstationsListContainer setShowSubstationsList={setShowSubstationsList} setShowControls={setShowControls} />
                    </div>
                )}
                <img
                    src={getMarkerImg()}
                    alt="Wind Turbine"
                    style={{
                        width: getMarkerSize(),
                        height: getMarkerSize(),
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                    }}
                    onClick={handleMarkerClick}
                    onMouseEnter={() => setShowPopup(true)}
                    onMouseLeave={() => setShowPopup(false)}
                />
            </div>
        </Marker>
    );
};

export default AssetMarker;
