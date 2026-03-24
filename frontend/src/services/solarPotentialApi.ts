// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export const fetchSolarPotential = async (longitude: number, latitude: number): Promise<number | null> => {
    try {
        const params = new URLSearchParams({
            longitude: String(longitude),
            latitude: String(latitude),
        });

        const response = await fetch(`/api/ui/solar-potential?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = (await response.json()) as { pvAnnualKwhPerKwp?: number | null };
        const value = Number(data.pvAnnualKwhPerKwp);
        return Number.isFinite(value) ? value : null;
    } catch (err) {
        console.error('Error fetching solar potential:', err);
        return null;
    }
};
