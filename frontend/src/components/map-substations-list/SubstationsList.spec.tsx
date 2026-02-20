// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SubstationsList, { type Substation } from './SubstationsList';

describe('SubstationsList', () => {
    it('renders with default items', () => {
        const manyItems: Substation[] = [
            { id: 1, name: 'Item 1', distanceFromTurbine: '100', coordinates: [1, 2] },
            { id: 1, name: 'Item 2', distanceFromTurbine: '200', coordinates: [1, 2] },
            { id: 1, name: 'Item 3', distanceFromTurbine: '300', coordinates: [1, 2] },
            { id: 1, name: 'Item 4', distanceFromTurbine: '400', coordinates: [1, 2] },
            { id: 1, name: 'Item 5', distanceFromTurbine: '500', coordinates: [1, 2] },
        ];
        render(<SubstationsList items={manyItems} />);

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
        expect(screen.getByText('Distance: 100km')).toBeInTheDocument();
        expect(screen.getByText('Distance: 200km')).toBeInTheDocument();
        expect(screen.getByText('Distance: 300km')).toBeInTheDocument();
        expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('renders with custom items', () => {
        const customItems: Substation[] = [
            { id: 1, name: 'Custom 1', distanceFromTurbine: '150', coordinates: [1, 2] },
            { id: 1, name: 'Custom 2', distanceFromTurbine: '250', coordinates: [1, 2] },
            { id: 1, name: 'Custom 3', distanceFromTurbine: '350', coordinates: [1, 2] },
        ];
        render(<SubstationsList items={customItems} />);

        expect(screen.getByText('Custom 1')).toBeInTheDocument();
        expect(screen.getByText('Custom 2')).toBeInTheDocument();
        expect(screen.getByText('Custom 3')).toBeInTheDocument();
        expect(screen.getByText('Distance: 150km')).toBeInTheDocument();
        expect(screen.getByText('Distance: 250km')).toBeInTheDocument();
        expect(screen.getByText('Distance: 350km')).toBeInTheDocument();
    });

    it('renders all items provided', () => {
        const manyItems: Substation[] = [
            { id: 1, name: 'Item 1', distanceFromTurbine: '100', coordinates: [1, 2] },
            { id: 1, name: 'Item 2', distanceFromTurbine: '200', coordinates: [1, 2] },
            { id: 1, name: 'Item 3', distanceFromTurbine: '300', coordinates: [1, 2] },
            { id: 1, name: 'Item 4', distanceFromTurbine: '400', coordinates: [1, 2] },
            { id: 1, name: 'Item 5', distanceFromTurbine: '500', coordinates: [1, 2] },
        ];
        render(<SubstationsList items={manyItems} />);

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
        expect(screen.getByText('Item 4')).toBeInTheDocument();
        expect(screen.getByText('Item 5')).toBeInTheDocument();
        expect(screen.getByText('Distance: 100km')).toBeInTheDocument();
        expect(screen.getByText('Distance: 200km')).toBeInTheDocument();
        expect(screen.getByText('Distance: 300km')).toBeInTheDocument();
        expect(screen.getByText('Distance: 400km')).toBeInTheDocument();
        expect(screen.getByText('Distance: 500km')).toBeInTheDocument();
    });

    it('disables confirm button until an item is selected', () => {
        const manyItems: Substation[] = [
            { id: 1, name: 'Item 1', distanceFromTurbine: '100', coordinates: [1, 2] },
            { id: 1, name: 'Item 2', distanceFromTurbine: '200', coordinates: [1, 2] },
            { id: 1, name: 'Item 3', distanceFromTurbine: '300', coordinates: [1, 2] },
            { id: 1, name: 'Item 4', distanceFromTurbine: '400', coordinates: [1, 2] },
            { id: 1, name: 'Item 5', distanceFromTurbine: '500', coordinates: [1, 2] },
        ];
        render(<SubstationsList items={manyItems} />);

        const confirmButton = screen.getByText('Confirm');
        expect(confirmButton).toBeDisabled();

        fireEvent.click(screen.getByText('Item 2'));
        expect(confirmButton).not.toBeDisabled();
    });

    it('calls onConfirm with the selected item when confirm button is clicked', () => {
        const manyItems: Substation[] = [
            { id: 1, name: 'Item 1', distanceFromTurbine: '100', coordinates: [1, 2] },
            { id: 1, name: 'Item 2', distanceFromTurbine: '200', coordinates: [1, 2] },
            { id: 1, name: 'Item 3', distanceFromTurbine: '300', coordinates: [1, 2] },
            { id: 1, name: 'Item 4', distanceFromTurbine: '400', coordinates: [1, 2] },
            { id: 1, name: 'Item 5', distanceFromTurbine: '500', coordinates: [1, 2] },
        ];
        const mockOnConfirm = vi.fn();
        render(<SubstationsList items={manyItems} onConfirm={mockOnConfirm} />);

        // Select an item
        fireEvent.click(screen.getByText('Item 1'));

        // Click confirm
        fireEvent.click(screen.getByText('Confirm'));

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnConfirm).toHaveBeenCalledWith({ id: 1, name: 'Item 1', distanceFromTurbine: '100', coordinates: [1, 2] });
    });

    it('does not call onConfirm when confirm button is clicked without selection', () => {
        const mockOnConfirm = vi.fn();
        render(<SubstationsList onConfirm={mockOnConfirm} />);

        // Confirm button should be disabled, but try to click it anyway
        fireEvent.click(screen.getByText('Confirm'));

        expect(mockOnConfirm).not.toHaveBeenCalled();
    });
});
