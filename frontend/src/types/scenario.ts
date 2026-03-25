// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export type ScenarioAttributeValue = string | number;

export interface ScenarioAttribute {
    id: string;
    value: ScenarioAttributeValue;
}

export interface ScenarioLayerConfig {
    layerId: string;
    attributes: ScenarioAttribute[];
}

export interface Scenario {
    id: string;
    name: string;
    description?: string;
    source?: 'predefined' | 'user';
    layers: ScenarioLayerConfig[];
}

export interface ScenarioCollection {
    scenarios: Scenario[];
}
