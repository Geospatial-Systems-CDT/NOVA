// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { FeatureCollection, Point } from 'geojson';
import { useEffect } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';

interface AssetLayerProps {
    data: FeatureCollection<Point>;
}

const AssetLayer = ({ data }: AssetLayerProps) => {
    const { current: map } = useMap();

    useEffect(() => {
        if (!map) return;

        const imageLoadPromises = data.features.map(
            (feature) =>
                new Promise<void>((resolve, reject) => {
                    const imageUrl = feature.properties?.icon;
                    if (!imageUrl || map.hasImage(imageUrl)) {
                        resolve();
                        return;
                    }
                    map.loadImage(imageUrl)
                        .then((image) => {
                            if (image) {
                                map.addImage(imageUrl, image.data);
                            }
                            resolve();
                        })
                        .catch((error) => {
                            reject(error instanceof Error ? error : new Error(String(error)));
                        });
                })
        );

        Promise.all(imageLoadPromises).catch((error) => console.error('Failed to load asset images:', error));
    }, [data, map]);

    return (
        <Source id="asset-source" type="geojson" data={data}>
            <Layer
                id="asset-layer"
                type="symbol"
                layout={{
                    'icon-image': ['get', 'icon'],
                    'icon-size': 0.15,
                    'icon-allow-overlap': true,
                }}
            />
        </Source>
    );
};

export default AssetLayer;
