// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Asset, Variation } from '../search/add-asset/AddAsset';

const WIND_ASSET_ID = 'windTurbine';
const SOLAR_ASSET_ID = 'solarPanel';

const isSolarIconPath = (iconPath?: string) => iconPath?.toLowerCase().includes('solar') ?? false;

export const getSelectedAssetId = (markerVariant: Variation | null, cachedAssets: Asset[] | null): string => {
    if (!markerVariant) {
        return WIND_ASSET_ID;
    }

    const matchedAsset = cachedAssets?.find((asset) => asset.variations.some((variation) => variation.name === markerVariant.name));
    if (matchedAsset) {
        return matchedAsset.id;
    }

    return isSolarIconPath(markerVariant.icon) ? SOLAR_ASSET_ID : WIND_ASSET_ID;
};

export const isSolarAssetSelected = (markerVariant: Variation | null, cachedAssets: Asset[] | null): boolean =>
    getSelectedAssetId(markerVariant, cachedAssets) === SOLAR_ASSET_ID;
