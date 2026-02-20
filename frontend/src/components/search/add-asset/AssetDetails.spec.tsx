// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Asset, Variation } from './AddAsset';
import AssetDetails from './AssetDetails';

describe('AssetDetails', () => {
    const mockAsset: Asset = {
        id: 'windTurbine',
        name: 'Wind Turbine',
        variations: [],
    };

    const mockVariant: Variation = {
        name: 'Vestas',
        image: '/images/turbine-one.png',
        icon: '/images/turbine-icon.png',
        specification: [
            { name: 'Model', value: 'v3' },
            { name: 'Rotor Diameter', value: '40 m' },
            { name: 'Hub Height', value: '150 m' },
            { name: 'Wind speed', value: '3-20 m/s' },
        ],
    };

    it('renders with preview tab active by default', () => {
        render(<AssetDetails selectedAsset={mockAsset} selectedVariant={mockVariant} />);

        expect(screen.getByText('Preview')).toBeInTheDocument();
        expect(screen.getByText('Specifications')).toBeInTheDocument();
        expect(screen.getByLabelText('Wind Turbine preview')).toBeInTheDocument();
    });

    it('displays the variant image in preview tab', () => {
        render(<AssetDetails selectedAsset={mockAsset} selectedVariant={mockVariant} />);

        const bannerImage = screen.getByLabelText('Wind Turbine preview');
        expect(bannerImage).toHaveStyle({ backgroundImage: 'url(/images/turbine-one.png)' });
    });

    it('switches to specifications tab when clicked', async () => {
        const user = userEvent.setup();
        render(<AssetDetails selectedAsset={mockAsset} selectedVariant={mockVariant} />);

        await user.click(screen.getByText('Specifications'));

        expect(screen.getByText('Model')).toBeInTheDocument();
        expect(screen.getByText('v3')).toBeInTheDocument();
        expect(screen.getByText('Rotor Diameter')).toBeInTheDocument();
        expect(screen.getByText('40 m')).toBeInTheDocument();
    });

    it('displays all specification items in a table', async () => {
        const user = userEvent.setup();
        render(<AssetDetails selectedAsset={mockAsset} selectedVariant={mockVariant} />);

        await user.click(screen.getByText('Specifications'));

        expect(screen.getByText('Model')).toBeInTheDocument();
        expect(screen.getByText('v3')).toBeInTheDocument();
        expect(screen.getByText('Rotor Diameter')).toBeInTheDocument();
        expect(screen.getByText('40 m')).toBeInTheDocument();
        expect(screen.getByText('Hub Height')).toBeInTheDocument();
        expect(screen.getByText('150 m')).toBeInTheDocument();
    });

    it('switches back to preview tab when clicked', async () => {
        const user = userEvent.setup();
        render(<AssetDetails selectedAsset={mockAsset} selectedVariant={mockVariant} />);

        await user.click(screen.getByText('Specifications'));
        expect(screen.getByText('Model')).toBeInTheDocument();

        await user.click(screen.getByText('Preview'));
        expect(screen.getByLabelText('Wind Turbine preview')).toBeInTheDocument();
    });

    it('shows specifications list when specifications tab is active', async () => {
        const user = userEvent.setup();
        render(<AssetDetails selectedAsset={mockAsset} selectedVariant={mockVariant} />);

        await user.click(screen.getByText('Specifications'));

        expect(screen.getByText('Model')).toBeInTheDocument();
        expect(screen.getByText('v3')).toBeInTheDocument();
    });
});
