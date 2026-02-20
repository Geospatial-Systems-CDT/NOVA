// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export interface ConfirmPolygonButtonProps {
    onConfirm: () => void;
}

const ConfirmPolygonButton = ({ onConfirm }: ConfirmPolygonButtonProps) => {
    const handleClick = () => {
        onConfirm();
    };

    return (
        <button
            onClick={handleClick}
            style={{
                background: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
            }}
        >
            <img src="/icons/confirm-polygon.svg" alt="Set polygon" width={24} height={24} />
            Set
        </button>
    );
};

export default ConfirmPolygonButton;
