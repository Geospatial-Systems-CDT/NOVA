// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import AddAssetButton from './AddAssetButton';
import { useState } from 'react';
import * as mapStore from '../../../stores/useMapStore';

vi.mock('../../../stores/useMapStore', async () => {
    const actual = await vi.importActual('../../../stores/useMapStore');
    return {
        ...actual,
        useMapStore: vi.fn(),
    };
});

vi.mock('./AddAssetPanel', () => ({
    default: ({ onClose, onSelect }: { onClose: () => void; onSelect: () => void }) => (
        <div data-testid="add-asset-panel">
            <button aria-label="Close panel" onClick={onClose}>
                Close Panel
            </button>
            <button aria-label="Select asset" onClick={onSelect}>
                Select Asset
            </button>
        </div>
    ),
}));

vi.mock('../../../shared/control-button/ControlButton', () => ({
    default: ({ children, onClick, 'aria-label': ariaLabel, isActive }: any) => (
        <button onClick={onClick} aria-label={ariaLabel} data-testid="control-button" data-active={isActive}>
            {children}
        </button>
    ),
}));

describe('AddAssetButton', () => {
    const setPlacingMock = vi.fn();
    const setMarkerPositionMock = vi.fn();

    const TestAddAssetWrapper = () => {
        const [isPanelOpen, setIsPanelOpen] = useState(false);
        return <AddAssetButton setIsPanelOpen={setIsPanelOpen} isPanelOpen={isPanelOpen} />;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        (mapStore.useMapStore as unknown as Mock).mockImplementation((selector) =>
            selector({
                setPlacing: setPlacingMock,
                cachedHeatmap: { mock: 'data' },
                setMarkerPosition: setMarkerPositionMock,
            })
        );
    });

    it('renders the add asset button if heatmap layer is present', async () => {
        render(<TestAddAssetWrapper />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
        });
    });

    it('shows the add asset text and icon when heatmap is present', async () => {
        render(<TestAddAssetWrapper />);
        await waitFor(() => {
            expect(screen.getByText('Add asset')).toBeInTheDocument();
            expect(screen.getByAltText('Add asset')).toBeInTheDocument();
        });
    });

    it('opens the panel when clicked', async () => {
        const user = userEvent.setup();
        render(<TestAddAssetWrapper />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
        });

        const button = screen.getByRole('button', { name: /add asset/i });
        await user.click(button);

        expect(screen.getByTestId('add-asset-panel')).toBeInTheDocument();
    });

    it('closes the panel when close button is clicked', async () => {
        const user = userEvent.setup();
        render(<TestAddAssetWrapper />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
        });

        const button = screen.getByRole('button', { name: /add asset/i });
        await user.click(button);

        const closeButton = screen.getByRole('button', { name: /close panel/i });
        await user.click(closeButton);

        expect(screen.queryByTestId('add-asset-panel')).not.toBeInTheDocument();
    });

    it('calls setPlacing and closes panel when asset is selected', async () => {
        const user = userEvent.setup();
        render(<TestAddAssetWrapper />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
        });

        const button = screen.getByRole('button', { name: /add asset/i });
        await user.click(button);

        const selectButton = screen.getByRole('button', { name: /select asset/i });
        await user.click(selectButton);

        expect(setPlacingMock).toHaveBeenCalledWith(true);
        expect(screen.queryByTestId('add-asset-panel')).not.toBeInTheDocument();
    });

    it('highlights the button when panel is open', async () => {
        const user = userEvent.setup();
        render(<TestAddAssetWrapper />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
        });

        const button = screen.getByTestId('control-button');

        // Initially, button should not be highlighted
        expect(button).toHaveAttribute('data-active', 'false');

        // Click to open panel
        await user.click(button);

        // Button should now be highlighted
        expect(button).toHaveAttribute('data-active', 'true');
        expect(screen.getByTestId('add-asset-panel')).toBeInTheDocument();

        // Close panel
        const closeButton = screen.getByRole('button', { name: /close panel/i });
        await user.click(closeButton);

        // Button should no longer be highlighted
        expect(button).toHaveAttribute('data-active', 'false');
        expect(screen.queryByTestId('add-asset-panel')).not.toBeInTheDocument();
    });

    it('uses correct icon based on panel state', async () => {
        const user = userEvent.setup();
        render(<TestAddAssetWrapper />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
        });

        const button = screen.getByTestId('control-button');
        const icon = screen.getByAltText('Add asset');

        // Initially, should use regular add icon
        expect(icon).toHaveAttribute('src', '/icons/add.svg');

        // Click to open panel
        await user.click(button);

        // Should now use white add icon
        expect(icon).toHaveAttribute('src', '/icons/add-white.svg');

        // Close panel
        const closeButton = screen.getByRole('button', { name: /close panel/i });
        await user.click(closeButton);

        // Should return to regular add icon
        expect(icon).toHaveAttribute('src', '/icons/add.svg');
    });
});
