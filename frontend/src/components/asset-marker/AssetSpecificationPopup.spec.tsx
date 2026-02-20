// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, vi, afterEach, type Mock } from 'vitest';
import AssetSpecificationPopup from './AssetSpecificationPopup';
import * as mapStore from '../../stores/useMapStore';

// Mock useMapStore
vi.mock('../../stores/useMapStore', async () => {
    const actual = await vi.importActual('../../stores/useMapStore');
    return {
        ...actual,
        useMapStore: vi.fn(),
    };
});

describe('AssetSpecificationPopup', () => {
    const mockAssets = [
        {
            id: 'windTurbine',
            name: 'Wind Turbine',
            variations: [
                {
                    name: 'Vestas',
                    image: 'image-url',
                    specification: [
                        { name: 'Model', value: 'V150-6.0' },
                        { name: 'Rotor diameter', value: '150 m' },
                    ],
                },
            ],
        },
    ];

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('renders the popup with asset and variant name and specs when variant is found', async () => {
        (mapStore.useMapStore as unknown as Mock).mockImplementation((selector) =>
            selector({
                markerVariant: { name: 'Vestas' },
                cachedAssets: mockAssets,
            })
        );

        render(<AssetSpecificationPopup />);

        await waitFor(() => {
            expect(screen.getByText('Wind Turbine: Vestas')).toBeInTheDocument();
        });

        expect(screen.getByText('Model: V150-6.0')).toBeInTheDocument();
        expect(screen.getByText('Rotor diameter: 150 m')).toBeInTheDocument();
    });

    it('returns null if no variant is selected', () => {
        (mapStore.useMapStore as unknown as Mock).mockImplementation((selector) =>
            selector({
                markerVariant: null,
                cachedAssets: mockAssets,
            })
        );

        const { container } = render(<AssetSpecificationPopup />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null if no match is found in the cachedAssets', async () => {
        (mapStore.useMapStore as unknown as Mock).mockImplementation((selector) =>
            selector({
                markerVariant: { name: 'UnknownVariant' },
                cachedAssets: mockAssets,
            })
        );

        const { container } = render(<AssetSpecificationPopup />);
        await waitFor(() => {
            expect(container.firstChild).toBeNull();
        });
    });
});
