// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export interface DataLayerAttribute {
    id: string;
    /** Human-readable label for the attribute (e.g. "Distance from AONB"). Optional for legacy callers. */
    label?: string;
    value: number | string;
}
