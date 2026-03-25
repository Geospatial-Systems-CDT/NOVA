// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { Scenario } from '../../types/scenario';
import ScenarioPanel from './ScenarioPanel';

const setSelectedScenario = vi.fn();
const setScenarioIsCustom = vi.fn();
const setPlanningMode = vi.fn();
const setCreatingScenario = vi.fn();

let polygonStatus: 'none' | 'confirmed' = 'none';
let selectedScenario: Scenario | null = null;
let userScenariosVersion = 0;

vi.mock('../../stores/useMapStore', () => ({
    useMapStore: (selector: any) =>
        selector({
            polygonStatus,
            selectedScenario,
            setSelectedScenario,
            setScenarioIsCustom,
            setPlanningMode,
            setCreatingScenario,
            userScenariosVersion,
        }),
}));

vi.mock('../../utils/scenarioStorage', () => ({
    loadUserScenarios: () => [],
}));

describe('ScenarioPanel', () => {
    let fetchSpy: MockInstance;

    beforeEach(() => {
        vi.clearAllMocks();
        polygonStatus = 'none';
        selectedScenario = null;
        userScenariosVersion = 0;

        fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                scenarios: [
                    {
                        id: 'balanced-wind',
                        name: 'Balanced Wind',
                        description: 'desc',
                        layers: [{ layerId: 'windSpeed', attributes: [{ id: 'minSpeed', value: 5 }] }],
                    },
                ],
            }),
        } as Response);
    });

    it('does not render when polygon is not confirmed', () => {
        render(<ScenarioPanel />);
        expect(screen.queryByText('Predefined scenarios')).not.toBeInTheDocument();
    });

    it('renders scenarios and selects one when polygon is confirmed', async () => {
        polygonStatus = 'confirmed';

        render(<ScenarioPanel />);

        expect(await screen.findByText('Predefined scenarios')).toBeInTheDocument();
        const card = await screen.findByText('Balanced Wind');

        await userEvent.click(card);

        expect(setSelectedScenario).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'balanced-wind',
                name: 'Balanced Wind',
            })
        );
    });

    it('requests scenario JSON from public data', async () => {
        polygonStatus = 'confirmed';

        render(<ScenarioPanel />);

        await screen.findByText('Balanced Wind');
        expect(fetchSpy).toHaveBeenCalledWith('/data/scenarios.json');
    });
});
