// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Substation } from '../components/map-substations-list/SubstationsList';
import type { Variation } from '../components/search/add-asset/AddAsset';
import type { EstimatedAssetStats } from '../utils/energyEstimation';

interface AssetEstimationRequest {
    variant: Variation | null;
    selectedSubstation: Substation;
    latitude: number;
    longitude: number;
    solarOrientation?: string;
    assetCount?: number;
}

export const fetchAssetEstimation = async (payload: AssetEstimationRequest): Promise<EstimatedAssetStats> => {
    const response = await fetch('/api/ui/asset/estimate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return (await response.json()) as EstimatedAssetStats;
};
