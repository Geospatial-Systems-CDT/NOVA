// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import EditPolygonButton from './EditPolygonButton';
import { useMapStore } from '../../../stores/useMapStore';

// Mock zustand store
vi.mock('../../../stores/useMapStore', () => ({
    useMapStore: vi.fn(),
}));

// Mock ControlIcon
vi.mock('../../../shared/control-icon/ControlIcon', () => ({
    default: ({ onClick, children, 'aria-label': ariaLabel }: any) => (
        <button onClick={onClick} data-testid="control-icon" aria-label={ariaLabel}>
            {children}
        </button>
    ),
}));

describe('EditPolygonButton', () => {
    const startPolygonEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const setPolygonStatus = (status: string) => {
        (useMapStore as unknown as Mock).mockImplementation((selector) => selector({ polygonStatus: status }));
    };

    it('does not render when polygonStatus is neither "confirmed" nor "editing"', () => {
        setPolygonStatus('none');
        render(<EditPolygonButton startPolygonEdit={startPolygonEdit} />);
        expect(screen.queryByTestId('control-icon')).not.toBeInTheDocument();
    });

    it('renders when polygonStatus is "confirmed"', () => {
        setPolygonStatus('confirmed');
        render(<EditPolygonButton startPolygonEdit={startPolygonEdit} />);
        expect(screen.getByTestId('control-icon')).toBeInTheDocument();
    });

    it('renders when polygonStatus is "editing"', () => {
        setPolygonStatus('editing');
        render(<EditPolygonButton startPolygonEdit={startPolygonEdit} />);
        expect(screen.getByTestId('control-icon')).toBeInTheDocument();
    });

    it('calls startPolygonEdit when clicked', () => {
        setPolygonStatus('confirmed');
        render(<EditPolygonButton startPolygonEdit={startPolygonEdit} />);
        const button = screen.getByTestId('control-icon');
        fireEvent.click(button);
        expect(startPolygonEdit).toHaveBeenCalledTimes(1);
    });
});
