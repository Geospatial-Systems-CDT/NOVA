// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { preventPolygonEdit } from './MapEditGuards';

describe('preventPolygonEdit', () => {
    let mockMap: any;
    let mockDraw: any;
    let mockCanvasStyle: { cursor: string };
    const point = { x: 100, y: 100 };

    beforeEach(() => {
        mockCanvasStyle = { cursor: '' };

        mockMap = {
            queryRenderedFeatures: vi.fn(),
            getCanvas: () => ({
                style: mockCanvasStyle,
            }),
        };

        mockDraw = {
            getMode: vi.fn(),
            changeMode: vi.fn(),
        };
    });

    it('should do nothing if draw is null', () => {
        preventPolygonEdit(mockMap, null, point);
        expect(mockMap.queryRenderedFeatures).not.toHaveBeenCalled();
    });

    it('should do nothing if draw mode starts with "draw"', () => {
        mockDraw.getMode.mockReturnValue('draw_polygon');
        preventPolygonEdit(mockMap, mockDraw, point);
        expect(mockMap.queryRenderedFeatures).not.toHaveBeenCalled();
    });

    it('should do nothing if no polygon features are found', () => {
        mockDraw.getMode.mockReturnValue('simple_select');
        mockMap.queryRenderedFeatures.mockReturnValue([
            { layer: { id: 'gl-draw-line-inactive' } }, // not a polygon
        ]);

        preventPolygonEdit(mockMap, mockDraw, point);
        expect(mockDraw.changeMode).not.toHaveBeenCalled();
        expect(mockCanvasStyle.cursor).toBe('');
    });

    it('should switch to simple_select mode if a polygon is clicked', () => {
        mockDraw.getMode.mockReturnValue('simple_select');
        mockMap.queryRenderedFeatures.mockReturnValue([{ layer: { id: 'gl-draw-polygon-inactive' } }]);

        preventPolygonEdit(mockMap, mockDraw, point);

        expect(mockDraw.changeMode).toHaveBeenCalledWith('simple_select', { featureIds: [] });
        expect(mockCanvasStyle.cursor).toBe('default');
    });
});
