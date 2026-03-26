// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MapRef } from 'react-map-gl/maplibre';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import * as mapStore from '../../stores/useMapStore';
import type { Scenario } from '../../types/scenario';
import { MapVisualHelper } from '../../utils/MapVisualHelper';
import LayerControlPanel from './LayerControlPanel';

const mockMapRef = { current: {} } as unknown as React.RefObject<MapRef>;
const mockDrawRef = { current: {} } as unknown as React.RefObject<MapboxDraw>;
const mockResetLayers = true;
const mockSetResetLayers = vi.fn() as React.Dispatch<React.SetStateAction<boolean>>;

const mockApiResponse = {
    categories: [
        {
            name: 'Environmental protected sites',
            items: [
                {
                    id: 'aonb',
                    name: 'Areas of outstanding natural beauty',
                    attributes: [
                        {
                            id: 'distance',
                            description: 'Distance from layer',
                            defaultValue: 2,
                            valueType: 'number',
                        },
                    ],
                },
            ],
        },
        {
            name: 'Weather',
            items: [
                {
                    id: 'windSpeed',
                    name: 'Wind speed',
                    attributes: [],
                },
            ],
        },
        {
            name: 'Residential',
            items: [
                {
                    id: 'residentialBuiltUp',
                    name: 'Built up areas',
                    attributes: [],
                },
            ],
        },
    ],
};

const fakeGeoJSON = {
    type: 'FeatureCollection',
    features: [],
};

describe('LayerControlPanel', () => {
    let fetchSpy: MockInstance;
    let mockLayersPanelOpen = true;
    let mockSetLayersPanelOpen: ReturnType<typeof vi.fn>;
    let selectedScenario: Scenario | null = null;
    let scenarioIsCustom = false;

    beforeEach(() => {
        vi.clearAllMocks();
        mockLayersPanelOpen = true;
        selectedScenario = null;
        scenarioIsCustom = false;
        mockSetLayersPanelOpen = vi.fn((open: boolean) => {
            mockLayersPanelOpen = open;
        });

        vi.spyOn(mapStore, 'useMapStore').mockImplementation((selector) =>
            selector({
                polygonStatus: 'confirmed',
                layersPanelOpen: mockLayersPanelOpen,
                setLayersPanelOpen: mockSetLayersPanelOpen,
                setCachedHeatmap: vi.fn(),
                setCachedReport: vi.fn(),
                setReportJobId: vi.fn(),
                setReportLoading: vi.fn(),
                setLastGeneratedAnalysisMethod: vi.fn(),
                selectedScenario,
                scenarioIsCustom,
                setScenarioIsCustom: vi.fn((value: boolean) => {
                    scenarioIsCustom = value;
                }),
                creatingScenario: false,
                setCreatingScenario: vi.fn(),
                setSelectedScenario: vi.fn(),
                bumpUserScenariosVersion: vi.fn(),
            } as unknown as mapStore.MapState)
        );

        (mapStore.useMapStore as any).getState = () => ({
            polygonStatus: 'confirmed',
            layersPanelOpen: mockLayersPanelOpen,
            setLayersPanelOpen: mockSetLayersPanelOpen,
            setCachedHeatmap: vi.fn(),
            setCachedReport: vi.fn(),
            setReportJobId: vi.fn(),
            setReportLoading: vi.fn(),
            setLastGeneratedAnalysisMethod: vi.fn(),
            selectedScenario,
            scenarioIsCustom,
            setScenarioIsCustom: vi.fn((value: boolean) => {
                scenarioIsCustom = value;
            }),
            creatingScenario: false,
            setCreatingScenario: vi.fn(),
            setSelectedScenario: vi.fn(),
            bumpUserScenariosVersion: vi.fn(),
        });

        fetchSpy = vi.spyOn(global, 'fetch' as any).mockImplementation((...args: unknown[]) => {
            const url = args[0] as string;
            if (url === '/api/ui/layers') {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockApiResponse,
                }) as unknown as Promise<Response>;
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ heatmap: fakeGeoJSON, jobId: 'job-1' }),
            }) as unknown as Promise<Response>;
        });

        vi.spyOn(MapVisualHelper, 'addOrUpdateHeatmapLayer').mockImplementation(() => {});
        vi.spyOn(MapVisualHelper, 'getFirstPolygon').mockReturnValue({ type: 'Polygon', coordinates: [] as any });
        vi.spyOn(MapVisualHelper, 'getFeatureCollection').mockReturnValue(fakeGeoJSON as any);
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    it('renders panel with header and dual analysis buttons', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        expect(await screen.findByText('Layers')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /generate legacy analysis/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /generate weighted analysis/i })).toBeInTheDocument();
    });

    it('renders some layer names and their checkboxes', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        expect(await screen.findByText('Areas of outstanding natural beauty')).toBeInTheDocument();
        expect(await screen.findByText('Wind speed')).toBeInTheDocument();
        expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    });

    it('toggles checkbox state when clicked', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        const checkbox = await screen.findByLabelText('Wind speed');
        expect((checkbox as HTMLInputElement).checked).toBe(true);
        await userEvent.click(checkbox);
        expect((checkbox as HTMLInputElement).checked).toBe(false);
    });

    it('filters layers by search input', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        const searchInput = await screen.findByPlaceholderText('Search for layers');
        await userEvent.type(searchInput, 'built up');
        expect(await screen.findByText('Built up areas')).toBeInTheDocument();
        expect(screen.queryByText('Wind speed')).not.toBeInTheDocument();
    });

    it('shows "No results" for unmatched search', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        const searchInput = await screen.findByPlaceholderText('Search for layers');
        await userEvent.type(searchInput, 'nonexistent');
        expect(await screen.findByText('No results')).toBeInTheDocument();
    });

    it('clears search when clear button is clicked and re-expands all categories', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        const searchInput = await screen.findByPlaceholderText('Search for layers');
        await userEvent.type(searchInput, 'Wind');

        const clearBtn = await screen.findByLabelText('Clear search');
        await userEvent.click(clearBtn);

        expect(searchInput).toHaveValue('');
        expect(await screen.findByText('Wind speed')).toBeInTheDocument();

        // Check that all categories are visible again
        expect(screen.getByText('Environmental protected sites')).toBeInTheDocument();
        expect(screen.getByText('Weather')).toBeInTheDocument();
        expect(screen.getByText('Residential')).toBeInTheDocument();
    });

    it('shows no results when search is only spaces', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        const searchInput = await screen.findByPlaceholderText('Search for layers');
        await userEvent.type(searchInput, '   ');
        expect(await screen.findByText('No results')).toBeInTheDocument();
    });

    it('does not render accordion for categories with no matching layers', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        const searchInput = await screen.findByPlaceholderText('Search for layers');
        await userEvent.type(searchInput, 'wind');

        expect(screen.queryByText('Residential')).not.toBeInTheDocument();
        expect(await screen.findByText('Wind speed')).toBeInTheDocument();
    });

    it('toggles accordion expansion', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        const summary = await screen.findByText('Environmental protected sites');
        await userEvent.click(summary);
        await userEvent.click(summary);
        expect(await screen.findByText('Areas of outstanding natural beauty')).toBeInTheDocument();
    });

    it('collapses and expands the panel with toggle button', async () => {
        const { rerender } = render(
            <LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />
        );
        await screen.findByText('Layers');

        const toggleBtn = screen.getAllByRole('button').find((btn) => btn.querySelector('svg'));
        await userEvent.click(toggleBtn!);

        rerender(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        expect(screen.queryByText('Layers')).not.toBeInTheDocument();

        await userEvent.click(toggleBtn!);

        rerender(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        expect(await screen.findByText('Layers')).toBeInTheDocument();
    });

    it('rotates toggle icon when collapsed', async () => {
        const { rerender } = render(
            <LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />
        );
        await screen.findByText('Layers');

        const toggleBtn = screen.getAllByRole('button').find((btn) => btn.querySelector('svg'));
        await userEvent.click(toggleBtn!);

        rerender(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);

        const icon = toggleBtn!.querySelector('svg');
        const styles = window.getComputedStyle(icon as Element);
        expect(styles.transform).toMatch(/rotate\(180deg\)/);
    });

    it('renders all userAdjustableParameters in the drawer', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        await screen.findByText('Areas of outstanding natural beauty');

        const targetBtn = screen.getAllByRole('button').find((btn) => btn.parentElement?.textContent?.includes('Areas of outstanding natural beauty'));
        await userEvent.click(targetBtn!);

        const input = await screen.findByLabelText('Distance from layer');
        expect(input).toBeInTheDocument();
        expect((input as HTMLInputElement).value).toBe('2');
    });

    it('prefills checked layers and values from selected scenario', async () => {
        selectedScenario = {
            id: 'test-scenario',
            name: 'Test Scenario',
            layers: [
                {
                    layerId: 'aonb',
                    attributes: [
                        {
                            id: 'distance',
                            value: 5,
                        },
                    ],
                },
            ],
        };

        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);

        const aonbCheckbox = await screen.findByLabelText('Areas of outstanding natural beauty');
        const windCheckbox = await screen.findByLabelText('Wind speed');

        expect((aonbCheckbox as HTMLInputElement).checked).toBe(true);
        expect((windCheckbox as HTMLInputElement).checked).toBe(false);

        const targetBtn = screen.getAllByRole('button').find((btn) => btn.parentElement?.textContent?.includes('Areas of outstanding natural beauty'));
        await userEvent.click(targetBtn!);

        const input = await screen.findByLabelText('Distance from layer');
        expect((input as HTMLInputElement).value).toBe('5');
    });

    it('sends the selected analysis method in analyse payload', async () => {
        render(<LayerControlPanel mapRef={mockMapRef} drawRef={mockDrawRef} resetLayers={mockResetLayers} setResetLayers={mockSetResetLayers} />);
        await screen.findByText('Layers');

        const legacyButton = screen.getByRole('button', { name: /generate legacy analysis/i });
        await userEvent.click(legacyButton);

        const analyseCall = fetchSpy.mock.calls.find((call) => call[0] === '/api/ui/location/analyse');
        expect(analyseCall).toBeDefined();

        const requestBody = JSON.parse((analyseCall?.[1] as RequestInit).body as string);
        expect(requestBody.analysisMethod).toBe('legacy');
        expect(requestBody.reportMaxRegions).toBe(20);
    });
});
