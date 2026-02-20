// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import DrawPolygonButton from './DrawPolygonButton';
import { useMapStore } from '../../../stores/useMapStore';

// Mock zustand store
vi.mock('../../../stores/useMapStore', () => ({
    useMapStore: vi.fn(),
}));

// Mock ControlIcon to simplify testing
vi.mock('../../../shared/control-icon/ControlIcon', () => ({
    default: ({ children, onClick, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed, isActive }: any) => (
        <button onClick={onClick} aria-label={ariaLabel} aria-pressed={ariaPressed} data-testid="control-icon" data-active={isActive}>
            {children}
        </button>
    ),
}));

describe('DrawPolygonButton', () => {
    const startPolygonDraw = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const setMockStoreStatus = (status: string) => {
        (useMapStore as unknown as Mock).mockImplementation((selector) => selector({ polygonStatus: status }));
    };

    it('does not render when polygonStatus is "editing"', () => {
        setMockStoreStatus('editing');

        render(<DrawPolygonButton startPolygonDraw={startPolygonDraw} />);
        expect(screen.queryByLabelText('Draw polygon')).not.toBeInTheDocument();
    });

    it('renders button when polygonStatus is "none"', () => {
        setMockStoreStatus('none');

        render(<DrawPolygonButton startPolygonDraw={startPolygonDraw} />);
        expect(screen.getByLabelText('Draw polygon')).toBeInTheDocument();
        expect(screen.getByTestId('control-icon')).toHaveAttribute('data-active', 'false');
    });

    it('renders active button when polygonStatus is "drawing"', () => {
        setMockStoreStatus('drawing');

        render(<DrawPolygonButton startPolygonDraw={startPolygonDraw} />);
        const button = screen.getByLabelText('Draw polygon');
        expect(button).toBeInTheDocument();
        expect(screen.getByTestId('control-icon')).toHaveAttribute('data-active', 'true');
    });

    it('renders active button when polygonStatus is "pendingConfirmation"', () => {
        setMockStoreStatus('pendingConfirmation');

        render(<DrawPolygonButton startPolygonDraw={startPolygonDraw} />);
        expect(screen.getByLabelText('Draw polygon')).toBeInTheDocument();
        expect(screen.getByTestId('control-icon')).toHaveAttribute('data-active', 'true');
    });

    it('calls startPolygonDraw when clicked', () => {
        setMockStoreStatus('none');

        render(<DrawPolygonButton startPolygonDraw={startPolygonDraw} />);
        const button = screen.getByLabelText('Draw polygon');

        fireEvent.click(button);
        expect(startPolygonDraw).toHaveBeenCalledTimes(1);
    });
});
