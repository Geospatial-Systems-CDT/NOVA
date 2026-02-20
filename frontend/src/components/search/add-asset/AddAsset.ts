// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export interface Specification {
    name: string;
    value: string;
}

export interface Variation {
    name: string;
    specification: Specification[];
    image: string;
    icon: string;
}

export interface Asset {
    id: string;
    name: string;
    variations: Variation[];
}
