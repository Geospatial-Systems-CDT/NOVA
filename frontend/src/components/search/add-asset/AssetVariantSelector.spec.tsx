// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Asset, Variation } from './AddAsset';
import AssetVariantSelector from './AssetVariantSelector';

describe('AssetVariantSelector', () => {
    const mockVariations: Variation[] = [
        {
            name: 'Vestas',
            image: '/images/turbine-one.png',
            icon: '/images/turbine-icon.png',
            specification: [
                { name: 'Model', value: 'v3' },
                { name: 'Rotor Diameter', value: '40 m' },
                { name: 'Hub Height', value: '150 m' },
                { name: 'Wind speed', value: '3-20 m/s' },
            ],
        },
        {
            name: 'Siemens Gamesa',
            image: '/images/turbine-two.png',
            icon: '/images/turbine-icon.png',
            specification: [
                { name: 'Model', value: 'v5' },
                { name: 'Rotor Diameter', value: '25 m' },
                { name: 'Hub Height', value: '100 m' },
                { name: 'Wind speed', value: '6-35 m/s' },
            ],
        },
    ];

    const mockAsset: Asset = {
        id: 'windTurbine',
        name: 'Wind Turbine',
        variations: mockVariations,
    };

    const mockSelectedVariant = mockVariations[0];
    const mockOnChange = vi.fn();

    it('renders all variant options as radio buttons', () => {
        render(<AssetVariantSelector selectedAsset={mockAsset} selectedVariant={mockSelectedVariant} onChange={mockOnChange} />);

        expect(screen.getByLabelText('Vestas')).toBeInTheDocument();
        expect(screen.getByLabelText('Siemens Gamesa')).toBeInTheDocument();
    });

    it('shows correct selected variant', () => {
        render(<AssetVariantSelector selectedAsset={mockAsset} selectedVariant={mockSelectedVariant} onChange={mockOnChange} />);

        const vestasRadio = screen.getByLabelText('Vestas') as HTMLInputElement;
        const siemensRadio = screen.getByLabelText('Siemens Gamesa') as HTMLInputElement;

        expect(vestasRadio.checked).toBe(true);
        expect(siemensRadio.checked).toBe(false);
    });

    it('calls onChange when a different variant is selected', async () => {
        const user = userEvent.setup();
        render(<AssetVariantSelector selectedAsset={mockAsset} selectedVariant={mockSelectedVariant} onChange={mockOnChange} />);

        await user.click(screen.getByLabelText('Siemens Gamesa'));

        expect(mockOnChange).toHaveBeenCalledWith(mockVariations[1]);
    });

    it('handles null selectedVariant gracefully', () => {
        render(<AssetVariantSelector selectedAsset={mockAsset} selectedVariant={null} onChange={mockOnChange} />);

        expect(screen.getByLabelText('Vestas')).toBeInTheDocument();
        expect(screen.getByLabelText('Siemens Gamesa')).toBeInTheDocument();
    });

    it('displays variant names as labels', () => {
        render(<AssetVariantSelector selectedAsset={mockAsset} selectedVariant={mockSelectedVariant} onChange={mockOnChange} />);

        expect(screen.getByText('Vestas')).toBeInTheDocument();
        expect(screen.getByText('Siemens Gamesa')).toBeInTheDocument();
    });
});
