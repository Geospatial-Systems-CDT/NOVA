// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Asset } from './ReportButton';
import AddAssetPanel from './ReportPanel';

let markerVariant: any = null;
const setMarkerVariant = vi.fn((variant) => {
    markerVariant = variant;
});
const setCachedAssets = vi.fn();

vi.mock('../../../stores/useMapStore', () => ({
    useMapStore: (selector: any) =>
        selector({
            markerVariant,
            setMarkerVariant,
            cachedAssets: null,
            setCachedAssets,
        }),
}));

vi.mock('./AssetTypeSelector', () => ({
    default: ({ selectedAsset, onChange, assets }: any) => (
        <div data-testid="asset-type-selector">
            <select value={selectedAsset?.id} onChange={(e) => onChange(e.target.value)}>
                {assets?.map((asset: any) => (
                    <option key={asset.id} value={asset.id}>
                        {asset.name}
                    </option>
                ))}
            </select>
        </div>
    ),
}));

vi.mock('./AssetDetails', () => ({
    default: ({ selectedVariant }: any) => (
        <div data-testid="asset-details">
            <div>Preview</div>
            <div>Specifications</div>
            {selectedVariant && <img src={selectedVariant.image} alt="preview" />}
        </div>
    ),
}));

vi.mock('./AssetVariantSelector', () => ({
    default: ({ selectedAsset, selectedVariant, onChange }: any) => (
        <div data-testid="asset-variant-selector">
            {selectedAsset?.variations.map((variant: any) => (
                <label key={variant.name}>
                    <input
                        type="radio"
                        name="variant"
                        value={variant.name}
                        checked={selectedVariant?.name === variant.name}
                        onChange={() => {
                            onChange(variant);
                            markerVariant = variant;
                        }}
                    />
                    {variant.name}
                </label>
            ))}
        </div>
    ),
}));

describe('AddAssetPanel', () => {
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
                        { name: 'Model', value: 'V150-6.0' },
                        { name: 'Rated Power', value: '6000 KW' },
                    ],
                },
            ],
        },
    ];

    const mockOnClose = vi.fn();
    const mockOnSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        markerVariant = null;
    });

    it('shows loading state while waiting for fetch', () => {
        vi.spyOn(window, 'fetch').mockImplementation(() => new Promise(() => {}));
        render(<AddAssetPanel onClose={mockOnClose} onSelect={mockOnSelect} />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('loads and sets cached assets then renders UI', async () => {
        vi.spyOn(window, 'fetch').mockResolvedValueOnce({
            json: async () => mockAssets,
        } as Response);

        render(<AddAssetPanel onClose={mockOnClose} onSelect={mockOnSelect} />);

        await waitFor(() => {
            expect(setCachedAssets).toHaveBeenCalledWith(mockAssets);
            expect(screen.getByTestId('asset-type-selector')).toBeInTheDocument();
        });
    });

    it('calls onClose when cancel button is clicked', async () => {
        vi.spyOn(window, 'fetch').mockResolvedValueOnce({
            json: async () => mockAssets,
        } as Response);

        const user = userEvent.setup();
        render(<AddAssetPanel onClose={mockOnClose} onSelect={mockOnSelect} />);

        await waitFor(() => screen.getByText('CANCEL'));
        await user.click(screen.getByText('CANCEL'));

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onSelect when select button is clicked and variant selected', async () => {
        vi.spyOn(window, 'fetch').mockResolvedValueOnce({
            json: async () => mockAssets,
        } as Response);

        markerVariant = mockAssets[0].variations[0];

        const user = userEvent.setup();
        render(<AddAssetPanel onClose={mockOnClose} onSelect={mockOnSelect} />);

        await waitFor(() => screen.getByText('SELECT'));
        await user.click(screen.getByText('SELECT'));

        expect(mockOnSelect).toHaveBeenCalledWith(mockAssets[0].variations[0]);
    });

    it('disables select button when no variant is selected', async () => {
        const assetsWithoutVariations = [
            {
                id: 'windTurbine',
                name: 'Wind Turbine',
                variations: [],
            },
        ];

        vi.spyOn(window, 'fetch').mockResolvedValueOnce({
            json: async () => assetsWithoutVariations,
        } as Response);

        render(<AddAssetPanel onClose={mockOnClose} onSelect={mockOnSelect} />);
        await waitFor(() => {
            expect(screen.getByText('SELECT')).toBeDisabled();
        });
    });

    it('handles fetch error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('Fetch failed'));

        render(<AddAssetPanel onClose={mockOnClose} onSelect={mockOnSelect} />);

        expect(await screen.findByRole('progressbar')).toBeInTheDocument();
        consoleSpy.mockRestore();
    });
});
