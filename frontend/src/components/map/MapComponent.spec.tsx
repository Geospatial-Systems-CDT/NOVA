// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen } from '@testing-library/react';
import type { ViewState } from 'react-map-gl/maplibre';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react'; //  use react's act
import MapComponent from '../../components/map/MapComponent';
import * as mapStore from '../../stores/useMapStore';
import type { MapState, PolygonStatus } from '../../stores/useMapStore';
import { MarkerStatus } from '../asset-marker/AssetMarkerStatus';

const createMockMapState = (overrides: Partial<MapState> = {}): MapState => ({
    mapRef: null, // simulate map is loaded or use a valid MapRef mock if needed
    setMapRef: vi.fn(),

    drawRef: null,
    setDrawRef: vi.fn(),

    showLayerControl: false,
    setShowLayerControl: vi.fn(),

    polygonConfirmPopup: null,
    setPolygonConfirmPopup: vi.fn(),

    placing: false,
    setPlacing: vi.fn(),

    markerPosition: null,
    setMarkerPosition: vi.fn(),

    markerBearing: null,
    setMarkerBearing: vi.fn(),

    markerVariant: null,
    setMarkerVariant: vi.fn(),

    markerStatus: MarkerStatus.Draft,
    setMarkerStatus: vi.fn(),

    cachedHeatmap: null,
    setCachedHeatmap: vi.fn(),

    cachedReport: null,
    setCachedReport: vi.fn(),

    reportJobId: null,
    setReportJobId: vi.fn(),

    reportLoading: false,
    setReportLoading: vi.fn(),

    gridConnectViewActive: false,
    setGridConnectViewActive: vi.fn(),

    selectedSubstation: null,
    setSelectedSubstation: vi.fn(),
    setSelectedSubstationById: vi.fn(),

    substations: [],
    setSubstations: vi.fn(),

    cachedAssets: null,
    setCachedAssets: vi.fn(),

    polygonStatus: 'none' as PolygonStatus,
    setPolygonStatus: vi.fn(),

    clearMarkerValues: vi.fn(),

    layersPanelOpen: false, // add this line to satisfy MapState
    setLayersPanelOpen: vi.fn(), // add this line to satisfy MapState

    selectedScenario: null,
    setSelectedScenario: vi.fn(),

    scenarioIsCustom: false,
    setScenarioIsCustom: vi.fn(),

    planningMode: 'scenarios',
    setPlanningMode: vi.fn(),

    creatingScenario: false,
    setCreatingScenario: vi.fn(),

    userScenariosVersion: 0,
    bumpUserScenariosVersion: vi.fn(),

    ...overrides,
});

// --- Mocks ---

vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [], //  return array to avoid .forEach crash
    })
);

vi.mock('../../components/search/SearchPanel', () => ({
    default: () => <div data-testid="search-panel" />,
}));

vi.mock('../../components/layer-selection/LayerControlPanel', () => ({
    default: () => <div data-testid="layer-panel" />,
}));

vi.mock('react-map-gl/maplibre', () => ({
    Map: ({
        children,
        onMove,
        onLoad,
        onClick,
    }: {
        children: React.ReactNode;
        onMove?: (evt: { viewState: ViewState }) => void;
        onLoad?: () => void;
        onClick?: (e: any) => void;
    }) => (
        <div
            data-testid="map"
            onClick={() => {
                onMove?.({
                    viewState: {
                        longitude: -1.33,
                        latitude: 50.65,
                        zoom: 10,
                        pitch: 60,
                        bearing: 0,
                        padding: { top: 0, bottom: 0, left: 0, right: 0 },
                    },
                });
                onLoad?.();
                onClick?.({ lngLat: { lng: -1.33, lat: 50.65 } });
            }}
        >
            {children}
        </div>
    ),
    Source: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Layer: () => null,
    Marker: ({ longitude, latitude, children }: { longitude: number; latitude: number; children: React.ReactNode }) => (
        <div data-testid="mock-marker" data-lng={longitude} data-lat={latitude}>
            {children}
        </div>
    ),
}));

vi.mock('../../components/map-controls/MapControls', () => ({
    default: ({ onStyleChange }: { onStyleChange: (style: string) => void }) => (
        <div data-testid="map-controls">
            <button onClick={() => onStyleChange('basic')}>Change Style</button>
        </div>
    ),
}));

// --- Tests ---

describe('MapComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render controls before map is initialized', () => {
        vi.spyOn(mapStore, 'useMapStore').mockImplementation((selector) => selector(createMockMapState({ mapRef: null })));

        render(<MapComponent />);
        expect(screen.getByTestId('map')).toBeInTheDocument();
        expect(screen.queryByTestId('map-controls')).not.toBeInTheDocument();
    });

    it('renders controls after map is initialized', async () => {
        vi.spyOn(mapStore, 'useMapStore').mockImplementation((selector) => selector(createMockMapState()));

        render(<MapComponent />);
        await act(async () => {
            fireEvent.click(screen.getByTestId('map'));
        });
        expect(screen.getByTestId('map-controls')).toBeInTheDocument();
    });

    it('handles map style changes', async () => {
        vi.spyOn(mapStore, 'useMapStore').mockImplementation((selector) => selector(createMockMapState()));

        render(<MapComponent />);
        await act(async () => {
            fireEvent.click(screen.getByTestId('map')); // triggers onLoad
        });

        const styleButton = await screen.findByText('Change Style'); //  wait for it
        fireEvent.click(styleButton);

        expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    it('handles map movement', async () => {
        vi.spyOn(mapStore, 'useMapStore').mockImplementation((selector) => selector(createMockMapState()));

        render(<MapComponent />);
        await act(async () => {
            fireEvent.click(screen.getByTestId('map'));
        });
        expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    it('shows the wind turbine confirmed icon when placed', async () => {
        vi.spyOn(mapStore, 'useMapStore').mockImplementation((selector) =>
            selector(
                createMockMapState({
                    placing: false,
                    markerPosition: { longitude: -1.33, latitude: 50.65 },
                })
            )
        );

        render(<MapComponent />);
        await act(async () => {
            fireEvent.click(screen.getByTestId('map'));
        });
        expect(screen.getByAltText('Wind Turbine')).toBeInTheDocument();
    });
});
