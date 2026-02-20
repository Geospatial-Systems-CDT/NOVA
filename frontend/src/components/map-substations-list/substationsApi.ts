// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { SubstationResponse } from '../../types/substationResponse';
import type { Substation } from './SubstationsList';

export const fetchSubstations = async (longitude: number, latitude: number): Promise<{ items: Substation[]; error: string | null }> => {
    let error = null;
    let items: Substation[] = [];

    try {
        const geoJsonData = {
            type: 'Point',
            coordinates: [longitude, latitude],
        };

        const response = await fetch('/api/ui/substations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify(geoJsonData),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: SubstationResponse[] = await response.json();
        items = data.map((item) => ({
            id: item.id,
            name: item.name,
            distanceFromTurbine: item.distance,
            coordinates: item.location.geometry.coordinates,
        }));
    } catch (err) {
        console.error('Error fetching substations:', err);
        error = 'Failed to load substations';
    }

    return { items, error };
};
