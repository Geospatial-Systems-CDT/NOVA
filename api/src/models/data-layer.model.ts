// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { DataLayerAttribute } from './data-layer-attribute.model';

export interface DataLayerDto {
    id: string;
    /** Human-readable display name of the layer (e.g. "Ancient woodland"). */
    name?: string;
    attributes: DataLayerAttribute[];
    analyze: boolean;
}
