// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Asset } from './AddAsset';
import AssetTypeSelector from './AssetTypeSelector';

describe('AssetTypeSelector', () => {
    const mockAssets: Asset[] = [
        {
            id: 'windTurbine',
            name: 'Wind Turbine',
            variations: [
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
            ],
        },
        {
            id: 'solarPanel',
            name: 'Solar Panel',
            variations: [
                {
                    name: 'Roof',
                    image: '/images/solar-one.png',
                    icon: '/images/solar-icon.png',
                    specification: [
                        { name: 'Model', value: 'v6' },
                        { name: 'Wattage', value: '250 W' },
                        { name: 'Efficency', value: '18%' },
                        { name: 'Voltage', value: '30 V' },
                    ],
                },
            ],
        },
    ];

    const mockSelectedAsset = mockAssets[0];
    const mockOnChange = vi.fn();

    it('renders with correct selected asset', () => {
        render(<AssetTypeSelector assets={mockAssets} selectedAsset={mockSelectedAsset} onChange={mockOnChange} />);

        expect(screen.getByText('Wind Turbine')).toBeInTheDocument();
    });

    it('displays all asset options in dropdown', async () => {
        const user = userEvent.setup();
        render(<AssetTypeSelector assets={mockAssets} selectedAsset={mockSelectedAsset} onChange={mockOnChange} />);

        const select = screen.getByRole('combobox');
        await user.click(select);

        const windTurbineOptions = screen.getAllByText('Wind Turbine');
        expect(windTurbineOptions.length).toBeGreaterThan(0);
        expect(screen.getByText('Solar Panel')).toBeInTheDocument();
    });

    it('calls onChange when a different asset is selected', async () => {
        const user = userEvent.setup();
        render(<AssetTypeSelector assets={mockAssets} selectedAsset={mockSelectedAsset} onChange={mockOnChange} />);

        const select = screen.getByRole('combobox');
        await user.click(select);
        await user.click(screen.getByText('Solar Panel'));

        expect(mockOnChange).toHaveBeenCalledWith('solarPanel');
    });

    it('has correct form control structure', () => {
        render(<AssetTypeSelector assets={mockAssets} selectedAsset={mockSelectedAsset} onChange={mockOnChange} />);

        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
});
