// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Scenario } from '../types/scenario';

const USER_SCENARIOS_STORAGE_KEY = 'nova.userScenarios.v1';

function isValidScenario(candidate: unknown): candidate is Scenario {
    if (!candidate || typeof candidate !== 'object') return false;

    const scenario = candidate as Partial<Scenario>;

    return (
        typeof scenario.id === 'string' &&
        typeof scenario.name === 'string' &&
        Array.isArray(scenario.layers) &&
        scenario.layers.every(
            (layer) =>
                typeof layer.layerId === 'string' &&
                Array.isArray(layer.attributes) &&
                layer.attributes.every((attribute) => typeof attribute.id === 'string' && ['string', 'number'].includes(typeof attribute.value))
        )
    );
}

export function loadUserScenarios(): Scenario[] {
    const raw = localStorage.getItem(USER_SCENARIOS_STORAGE_KEY);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(isValidScenario).map((scenario) => ({ ...scenario, source: 'user' as const }));
    } catch {
        return [];
    }
}

export function saveUserScenario(scenario: Scenario): Scenario[] {
    const existing = loadUserScenarios();
    const next = [...existing, { ...scenario, source: 'user' as const }];

    localStorage.setItem(USER_SCENARIOS_STORAGE_KEY, JSON.stringify(next));

    return next;
}

export function createUserScenarioId(name: string): string {
    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    return `user-${slug || 'scenario'}-${Date.now()}`;
}
