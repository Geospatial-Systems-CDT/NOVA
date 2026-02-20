// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render } from '@testing-library/react';
import type { FeatureCollection, Point } from 'geojson';
import { describe, expect, it, vi } from 'vitest';
import AssetLayer from './AssetLayer';

vi.mock('react-map-gl/maplibre', () => ({
    Layer: ({ id, type, layout }: any) => <div data-testid={`layer-${id}`} data-type={type} data-layout={JSON.stringify(layout)} />,
    Source: ({ id, type, data, children }: any) => (
        <div data-testid={`source-${id}`} data-type={type} data-features={JSON.stringify(data.features)}>
            {children}
        </div>
    ),
    useMap: () => ({
        current: {
            hasImage: vi.fn().mockReturnValue(false),
            loadImage: vi.fn().mockResolvedValue({
                data: { width: 32, height: 32 },
            }),
            addImage: vi.fn(),
        },
    }),
}));

describe('AssetLayer', () => {
    const mockData: FeatureCollection<Point> = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {
                    icon: '/images/turbine-icon.png',
                },
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [1, 1],
                },
                properties: {
                    icon: '/images/solar-icon.png',
                },
            },
        ],
    };

    it('renders Source and Layer components', () => {
        render(<AssetLayer data={mockData} />);

        expect(document.querySelector('[data-testid="source-asset-source"]')).toBeInTheDocument();
        expect(document.querySelector('[data-testid="layer-asset-layer"]')).toBeInTheDocument();
    });

    it('passes correct data to Source component', () => {
        render(<AssetLayer data={mockData} />);

        const source = document.querySelector('[data-testid="source-asset-source"]');
        expect(source).toHaveAttribute('data-type', 'geojson');
        expect(source).toHaveAttribute('data-features', JSON.stringify(mockData.features));
    });

    it('configures Layer with correct properties', () => {
        render(<AssetLayer data={mockData} />);

        const layer = document.querySelector('[data-testid="layer-asset-layer"]');
        expect(layer).toHaveAttribute('data-type', 'symbol');

        const layout = JSON.parse(layer!.getAttribute('data-layout')!);
        expect(layout['icon-image']).toEqual(['get', 'icon']);
        expect(layout['icon-size']).toBe(0.15);
        expect(layout['icon-allow-overlap']).toBe(true);
    });

    it('handles empty feature collection', () => {
        const emptyData: FeatureCollection<Point> = {
            type: 'FeatureCollection',
            features: [],
        };

        render(<AssetLayer data={emptyData} />);

        expect(document.querySelector('[data-testid="source-asset-source"]')).toBeInTheDocument();
        expect(document.querySelector('[data-testid="layer-asset-layer"]')).toBeInTheDocument();
    });

    it('handles features without icon properties', () => {
        const dataWithoutIcons: FeatureCollection<Point> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [0, 0],
                    },
                    properties: {},
                },
            ],
        };

        render(<AssetLayer data={dataWithoutIcons} />);

        expect(document.querySelector('[data-testid="source-asset-source"]')).toBeInTheDocument();
        expect(document.querySelector('[data-testid="layer-asset-layer"]')).toBeInTheDocument();
    });
});
