// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

declare module '@mapbox/mapbox-gl-draw' {
    import type { IControl, Map } from 'maplibre-gl';

    interface MapboxDrawOptions {
        displayControlsDefault?: boolean;
        controls?: {
            point?: boolean;
            line_string?: boolean;
            polygon?: boolean;
            trash?: boolean;
            combine_features?: boolean;
            uncombine_features?: boolean;
        };
        styles?: Array<{
            id: string;
            type: 'fill' | 'line' | 'circle' | 'symbol' | 'raster' | 'background';
            filter?: Array<string | boolean | number | Array<string | boolean | number>>;
            layout?: Record<string, string | number | boolean>;
            paint?: Record<string, string | number | boolean | Array<string | number>>;
        }>;
        touchEnabled?: boolean;
        touchMoveThreshold?: number;
        clickBuffer?: number;
        keybindings?: boolean;
        boxSelect?: boolean;
        touchPitch?: boolean;
        mode?: string;
    }

    export default class MapboxDraw implements IControl {
        constructor(options?: MapboxDrawOptions);

        onAdd(map: Map): HTMLElement;
        onRemove(map: Map): void;
        changeMode(mode: string, options?: Record<string, unknown>): void;
        getMode(): string;
        getAll(): Record<string, unknown>[];
        delete(id: string): void;
        deleteAll(): void;
    }
}
