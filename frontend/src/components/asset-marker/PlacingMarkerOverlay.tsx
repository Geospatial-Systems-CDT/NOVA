// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import React from 'react';
import windTurbineIcon from '../../assets/pending_turbine.svg';
import BlockIcon from '@mui/icons-material/Block';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface PlacingMarkerOverlayProps {
    mousePos: { x: number; y: number } | null;
    isInsidePolygon: boolean;
    suitability: 'darkRed' | 'red' | 'amber' | 'green' | null;
}

const PlacingMarkerOverlay: React.FC<PlacingMarkerOverlayProps> = ({ mousePos, isInsidePolygon, suitability }) => {
    if (!mousePos) return null;

    return (
        <div
            style={{
                position: 'fixed',
                left: mousePos.x,
                top: mousePos.y,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
                zIndex: 1000,
            }}
        >
            <div style={{ position: 'relative' }}>
                <img
                    src={windTurbineIcon}
                    alt="Wind Turbine pending"
                    style={{
                        width: '60px',
                        height: '60px',
                        cursor: 'pointer',
                        opacity: isInsidePolygon ? 1 : 0.4,
                    }}
                />

                {!isInsidePolygon && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            backgroundColor: 'red',
                            color: 'white',
                            fontSize: 14,
                            textAlign: 'center',
                            lineHeight: '18px',
                            fontWeight: 'bold',
                        }}
                    >
                        ×
                    </div>
                )}

                {isInsidePolygon && suitability && (
                    <div
                        style={{
                            position: 'absolute',
                            left: '100%',
                            top: '50%',
                            marginLeft: 10,
                            transform: 'translateY(-50%)',
                            backgroundColor: 'white',
                            padding: '6px 10px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                        }}
                    >
                        {suitability === 'darkRed' && <BlockIcon style={{ color: '#8B0000', marginRight: 6 }} />}
                        {suitability === 'red' && <BlockIcon style={{ color: 'red', marginRight: 6 }} />}
                        {suitability === 'amber' && <WarningAmberIcon style={{ color: '#f39c12', marginRight: 6 }} />}
                        {suitability === 'green' && <CheckCircleIcon style={{ color: 'green', marginRight: 6 }} />}
                        <span style={{ fontWeight: 500 }}>{suitability === 'red' ? 'Unsuitable' : suitability === 'amber' ? 'Caution' : 'Suitable'}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlacingMarkerOverlay;
