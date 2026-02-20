// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockMapRef } from '../../../test/test-utils';
import SearchPanel from './SearchPanel';

const mockDrawRef = { current: {} } as unknown as React.RefObject<MapboxDraw>;
const mockMapRef = createMockMapRef();
const mockOnPolygonDeleted = vi.fn();

let mockStore = {
    cachedHeatmap: { type: 'FeatureCollection', features: [] },
    polygonStatus: 'none',
};

const createEmptyFeatureCollection = () => ({ type: 'FeatureCollection', features: [] });

vi.mock('../../stores/useMapStore', () => ({
    useMapStore: vi.fn().mockImplementation((selector) => selector(mockStore)),
}));

const setUseMapStoreMock = (polygonStatus: string, cachedHeatmap: any = createEmptyFeatureCollection()) => {
    mockStore.polygonStatus = polygonStatus;
    mockStore.cachedHeatmap = cachedHeatmap;
};

vi.mock('../../hooks/usePolygonHandlers', () => ({
    usePolygonHandlers: () => ({
        startPolygonDraw: vi.fn(),
        handlePolygonDeleted: vi.fn(),
        startPolygonEdit: vi.fn(),
    }),
}));

vi.mock('./search-input/SearchInput', () => ({
    default: ({ onSearchResultClick }: { onSearchResultClick: (lat: number, lon: number, zoom: number) => void }) => (
        <input
            type="text"
            data-testid="search-input"
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onSearchResultClick(57.1497, -2.0943, 10);
                }
            }}
            aria-label="Search"
        />
    ),
}));

vi.mock('./draw-polygon/DrawPolygonButton', () => ({
    default: ({ startPolygonDraw }: { startPolygonDraw: () => void }) => (
        <button data-testid="draw-polygon-button" onClick={startPolygonDraw}>
            Draw Polygon
        </button>
    ),
}));

vi.mock('./delete-polygon/DeletePolygonButton', () => ({
    default: ({ deletePolygon }: { deletePolygon: () => void }) => (
        <button data-testid="delete-polygon-button" onClick={deletePolygon}>
            Delete Polygon
        </button>
    ),
}));

vi.mock('./edit-polygon/EditPolygonButton', () => ({
    default: ({ startPolygonEdit }: { startPolygonEdit: () => void }) => (
        <button data-testid="edit-polygon-button" onClick={startPolygonEdit}>
            Edit Polygon
        </button>
    ),
}));

vi.mock('./hide-map-layers/HideLayersButton', () => ({
    default: () => <button data-testid="hide-layers-button">Hide Layers</button>,
}));

vi.mock('./add-asset/AddAssetButton', () => ({
    default: ({ isPanelOpen, setIsPanelOpen }: { isPanelOpen: boolean; setIsPanelOpen: (open: boolean) => void }) => (
        <button
            data-testid="add-asset-button"
            onClick={() => {
                setIsPanelOpen(!isPanelOpen);
            }}
        >
            Toggle Panel
        </button>
    ),
}));

describe('SearchPanel', () => {
    beforeEach(() => {
        mockStore = {
            cachedHeatmap: { type: 'FeatureCollection', features: [] },
            polygonStatus: 'none',
        };
        vi.clearAllMocks();
    });

    it('renders confirmed state controls (delete, edit, hide buttons with dividers)', () => {
        setUseMapStoreMock('confirmed');
        render(<SearchPanel mapRef={mockMapRef} drawRef={mockDrawRef} isPanelOpen={false} setIsPanelOpen={() => {}} onPolygonDeleted={mockOnPolygonDeleted} />);
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.queryByTestId('draw-polygon-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('delete-polygon-button')).toBeInTheDocument();
        expect(screen.getByTestId('edit-polygon-button')).toBeInTheDocument();
        expect(screen.getByTestId('hide-layers-button')).toBeInTheDocument();
        expect(screen.getByTestId('add-asset-button')).toBeInTheDocument();
        expect(screen.getAllByRole('separator', { hidden: true }).length).toBe(2);
    });

    it('renders only draw and hide buttons with one divider', () => {
        setUseMapStoreMock('none');
        render(<SearchPanel mapRef={mockMapRef} drawRef={mockDrawRef} isPanelOpen={false} setIsPanelOpen={() => {}} onPolygonDeleted={mockOnPolygonDeleted} />);
        expect(screen.getByTestId('draw-polygon-button')).toBeInTheDocument();
        expect(screen.getByTestId('hide-layers-button')).toBeInTheDocument();
        expect(screen.queryByTestId('delete-polygon-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('edit-polygon-button')).not.toBeInTheDocument();
        expect(screen.getAllByRole('separator', { hidden: true }).length).toBe(1);
    });

    it('renders only one button and no dividers', () => {
        setUseMapStoreMock('none', null);
        render(<SearchPanel mapRef={mockMapRef} drawRef={mockDrawRef} isPanelOpen={false} setIsPanelOpen={() => {}} onPolygonDeleted={mockOnPolygonDeleted} />);
        expect(screen.getByTestId('draw-polygon-button')).toBeInTheDocument();
        expect(screen.queryByTestId('hide-layers-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('delete-polygon-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('edit-polygon-button')).not.toBeInTheDocument();
        expect(screen.queryAllByRole('separator', { hidden: true }).length).toBe(0);
    });

    it('renders editing state controls (delete, edit, hide buttons with dividers)', () => {
        setUseMapStoreMock('editing');
        render(<SearchPanel mapRef={mockMapRef} drawRef={mockDrawRef} isPanelOpen={false} setIsPanelOpen={() => {}} onPolygonDeleted={mockOnPolygonDeleted} />);
        expect(screen.queryByTestId('draw-polygon-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('delete-polygon-button')).toBeInTheDocument();
        expect(screen.getByTestId('edit-polygon-button')).toBeInTheDocument();
        expect(screen.getByTestId('hide-layers-button')).toBeInTheDocument();
        expect(screen.getAllByRole('separator', { hidden: true }).length).toBe(2);
    });
});
