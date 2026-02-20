// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, fireEvent } from '@testing-library/react';
import MapStylePanel from './MapStylePanel';
import type { MapStyle } from '../../../types/map';
import { vi } from 'vitest';

describe('MapStylePanel', () => {
    const mockOnStyleChange = vi.fn();

    const setup = (currentStyle: MapStyle = 'basic') => {
        render(<MapStylePanel onStyleChange={mockOnStyleChange} currentStyle={currentStyle} isOpen={true} onToggle={vi.fn()} />);
    };

    it('renders all map style options', () => {
        setup();

        const expectedLabels = ['Basic', 'Streets', 'Satellite', 'Bright'];

        expectedLabels.forEach((label) => {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        });
    });

    it('marks current style as selected', () => {
        setup('hybrid'); // "hybrid" is shown as "Satellite"

        const satelliteRadio = screen.getByLabelText('Satellite') as HTMLInputElement;
        expect(satelliteRadio.checked).toBe(true);
    });

    it('calls onStyleChange when selecting a different style', () => {
        setup('basic');

        const satelliteRadio = screen.getByLabelText('Satellite') as HTMLInputElement;
        fireEvent.click(satelliteRadio);

        expect(mockOnStyleChange).toHaveBeenCalledWith('hybrid');
    });
});
