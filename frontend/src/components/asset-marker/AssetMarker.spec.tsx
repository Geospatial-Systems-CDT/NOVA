// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as mapStore from '../../stores/useMapStore';
import AssetMarker from './AssetMarker';
import { MarkerStatus } from './AssetMarkerStatus';

vi.mock('react-map-gl/maplibre', async () => {
    const actual = await vi.importActual('react-map-gl/maplibre');
    return {
        ...actual,
        Marker: ({
            longitude,
            latitude,
            children,
            onDragEnd,
        }: {
            longitude: number;
            latitude: number;
            children: React.ReactNode;
            onDragEnd?: (e: any) => void;
        }) => (
            <button
                type="button"
                data-testid="mock-marker"
                data-lng={longitude}
                data-lat={latitude}
                onMouseUp={() => onDragEnd?.({ lngLat: { lng: longitude + 0.01, lat: latitude + 0.01 } })}
            >
                {children}
            </button>
        ),
    };
});

vi.mock('../map-substations-list/substationsApi', () => ({
    fetchSubstations: vi.fn(() => [{ text: 'Test', distance: 1 }]),
}));

vi.mock('./AssetControls', () => ({
    default: ({ onBoltClick, onDeleteClick, onMoveClick, onEditClick, isSubstationsListOpen }: any) => (
        <>
            <button aria-label="Connect to grid" onClick={onBoltClick} aria-pressed={isSubstationsListOpen ? 'true' : 'false'}>
                Connect
            </button>
            <button aria-label="Delete Asset" onClick={onDeleteClick}>
                Delete
            </button>
            <button aria-label="Move" onClick={onMoveClick}>
                Move
            </button>
            <button aria-label="Edit" onClick={onEditClick}>
                Edit
            </button>
        </>
    ),
}));

describe('AssetMarker', () => {
    const lat = 50.66;
    const lng = -1.28;
    const setPlacingMock = vi.fn();
    const setMarkerPositionMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(mapStore, 'useMapStore').mockImplementation((selector) =>
            selector({
                setPlacing: setPlacingMock,
                setMarkerPosition: setMarkerPositionMock,
                markerStatus: MarkerStatus.Draft,
                markerVariant: { name: 'BasicVariant' },
                cachedAssets: [
                    {
                        name: 'WindTurbine X',
                        variations: [
                            {
                                name: 'BasicVariant',
                                specification: [{ name: 'Power', value: '10MW' }],
                            },
                        ],
                    },
                ],
            } as unknown as mapStore.MapState)
        );
    });

    it('renders a marker at the correct location', () => {
        render(<AssetMarker longitude={lng} latitude={lat} />);
        const marker = screen.getByTestId('mock-marker');
        expect(marker).toHaveAttribute('data-lng', lng.toString());
        expect(marker).toHaveAttribute('data-lat', lat.toString());
    });

    it('shows controls by default on first render', () => {
        render(<AssetMarker longitude={lng} latitude={lat} />);
        expect(screen.getByLabelText('Edit')).toBeInTheDocument();
        expect(screen.getByLabelText('Connect to grid')).toBeInTheDocument();
        expect(screen.getByLabelText('Delete Asset')).toBeInTheDocument();
        expect(screen.getByLabelText('Move')).toBeInTheDocument();
    });

    it('toggles controls visibility when marker is clicked', () => {
        render(<AssetMarker longitude={lng} latitude={lat} />);
        const img = screen.getByAltText('Wind Turbine');

        // First click hides
        fireEvent.click(img);
        expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();

        // Second click shows again
        fireEvent.click(img);
        expect(screen.getByLabelText('Edit')).toBeInTheDocument();
    });

    it('calls onBoltClick and shows substations list', async () => {
        const boltFn = vi.fn();
        render(<AssetMarker onBoltClick={boltFn} longitude={lng} latitude={lat} />);

        // controls are already visible
        fireEvent.click(screen.getByLabelText('Connect to grid'));
        expect(boltFn).toHaveBeenCalledOnce();

        await waitFor(() => {
            expect(screen.getByText(/Choose Substation/i)).toBeInTheDocument();
        });
    });

    it('calls setMarkerPosition on delete', () => {
        render(<AssetMarker longitude={lng} latitude={lat} />);
        fireEvent.click(screen.getByLabelText('Delete Asset'));
        expect(setMarkerPositionMock).toHaveBeenCalledOnce();
        expect(setMarkerPositionMock).toHaveBeenCalledWith(null);
    });

    it('calls setMarkerPosition and setPlacing on move', () => {
        render(<AssetMarker longitude={lng} latitude={lat} />);
        fireEvent.click(screen.getByLabelText('Move'));
        expect(setMarkerPositionMock).toHaveBeenCalledOnce();
        expect(setPlacingMock).toHaveBeenCalledWith(true);
    });

    it('returns null if coordinates are missing', () => {
        const { container } = render(<AssetMarker />);
        expect(container.firstChild).toBeNull();
    });

    it('calls setIsPanelOpen(true) on edit click', () => {
        const setPanelOpenMock = vi.fn();
        render(<AssetMarker longitude={lng} latitude={lat} setIsPanelOpen={setPanelOpenMock} />);
        fireEvent.click(screen.getByLabelText('Edit'));
        expect(setPanelOpenMock).toHaveBeenCalledWith(true);
    });
});
