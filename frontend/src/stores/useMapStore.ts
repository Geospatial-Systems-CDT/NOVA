// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { FeatureCollection } from 'geojson';
import type { MapLayerMouseEvent, Popup } from 'maplibre-gl';
import type { MapRef } from 'react-map-gl/maplibre';
import { create } from 'zustand';
import { MarkerStatus } from '../components/asset-marker/AssetMarkerStatus';
import type { Substation } from '../components/map-substations-list/SubstationsList';
import type { Asset, Variation } from '../components/search/add-asset/AddAsset';
import type { ReportDTO } from '../types/report';
import type { Scenario } from '../types/scenario';
import { CACHED_REPORT_STORAGE_KEY } from '../types/report';

export type PolygonStatus = 'none' | 'drawing' | 'editing' | 'pendingConfirmation' | 'confirmed';
export type PlanningMode = 'scenarios' | 'layers';

export interface MapState {
    mapRef: MapRef | null;
    setMapRef: (ref: MapRef) => void;

    drawRef: MapboxDraw | null;
    setDrawRef: (ref: MapboxDraw) => void;

    showLayerControl: boolean;
    setShowLayerControl: (layerControl: boolean) => void;

    polygonConfirmPopup: Popup | null;
    setPolygonConfirmPopup: (ref: Popup | null) => void;

    placing: boolean;
    setPlacing: (placing: boolean) => void;

    markerPosition: { longitude?: number; latitude?: number } | null;
    setMarkerPosition: (position: { longitude?: number; latitude?: number } | null) => void;

    markerBearing: number | null;
    setMarkerBearing: (bearing: number) => void;

    markerVariant: Variation | null;
    setMarkerVariant: (variant: Variation | null) => void;
    solarOrientation: string;
    setSolarOrientation: (orientation: string) => void;
    assetCount: number;
    setAssetCount: (count: number) => void;
    markerStatus: MarkerStatus;
    setMarkerStatus: (status: MarkerStatus) => void;

    cachedHeatmap: FeatureCollection | null;
    setCachedHeatmap: (featureCollection: FeatureCollection | null) => void;

    cachedReport: ReportDTO | null;
    setCachedReport: (report: ReportDTO | null) => void;

    reportJobId: string | null;
    setReportJobId: (id: string | null) => void;

    reportLoading: boolean;
    setReportLoading: (loading: boolean) => void;

    reportLayerVisible: boolean;
    setReportLayerVisible: (visible: boolean) => void;

    reportLayerData: FeatureCollection | null;
    setReportLayerData: (featureCollection: FeatureCollection | null) => void;

    gridConnectViewActive: boolean;
    setGridConnectViewActive: (active: boolean) => void;

    selectedSubstation: Substation | null;
    setSelectedSubstation: (substation: Substation | null) => void;
    setSelectedSubstationById: (substationId: number) => void;

    substations: Substation[];
    setSubstations: (substations: Substation[]) => void;

    cachedAssets: Asset[] | null;
    setCachedAssets: (assets: Asset[] | null) => void;

    polygonStatus: PolygonStatus;
    setPolygonStatus: (status: PolygonStatus) => void;

    layersPanelOpen: boolean;
    setLayersPanelOpen: (open: boolean) => void;

    selectedScenario: Scenario | null;
    setSelectedScenario: (scenario: Scenario | null) => void;

    scenarioIsCustom: boolean;
    setScenarioIsCustom: (isCustom: boolean) => void;

    planningMode: PlanningMode;
    setPlanningMode: (mode: PlanningMode) => void;

    creatingScenario: boolean;
    setCreatingScenario: (creating: boolean) => void;

    userScenariosVersion: number;
    bumpUserScenariosVersion: () => void;

    clearMarkerValues: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
    mapRef: null,
    setMapRef: (ref) => set({ mapRef: ref }),

    drawRef: null,
    setDrawRef: (ref) => set({ drawRef: ref }),

    showLayerControl: false,
    setShowLayerControl: (layerControl) => set({ showLayerControl: layerControl }),

    polygonConfirmPopup: null,
    setPolygonConfirmPopup: (popup) => set({ polygonConfirmPopup: popup }),

    placing: false,
    setPlacing: (placing) => set({ placing: placing }),

    markerPosition: null,
    setMarkerPosition: (position) => set({ markerPosition: position }),
    markerBearing: null,
    setMarkerBearing: (bearing) => set({ markerBearing: bearing }),
    markerVariant: null,
    setMarkerVariant: (variant) => set({ markerVariant: variant }),
    solarOrientation: 'south',
    setSolarOrientation: (orientation) => set({ solarOrientation: orientation }),
    assetCount: 1,
    setAssetCount: (count) => set({ assetCount: Math.max(1, Math.floor(count)) }),
    markerStatus: MarkerStatus.Draft,
    setMarkerStatus: (status) => set({ markerStatus: status }),

    gridConnectViewActive: false,
    setGridConnectViewActive: (active) => set({ gridConnectViewActive: active }),

    substations: [],
    setSubstations: (substations) => set({ substations: substations }),

    selectedSubstation: null,
    setSelectedSubstation: (substation) => set({ selectedSubstation: substation }),
    setSelectedSubstationById: (substationId) =>
        set((state) => {
            const substations = state.substations.filter((substation) => substation.id === substationId);
            if (substations.length > 1) throw new Error(`Duplicate ID found for substation ${substationId}`);
            return { selectedSubstation: substations[0] };
        }),

    cachedHeatmap: null,
    setCachedHeatmap: (featureCollection) => set({ cachedHeatmap: featureCollection }),

    cachedReport: null,
    setCachedReport: (report) => {
        if (report) {
            localStorage.setItem(CACHED_REPORT_STORAGE_KEY, JSON.stringify(report));
        } else {
            localStorage.removeItem(CACHED_REPORT_STORAGE_KEY);
        }
        set({ cachedReport: report });
    },

    reportJobId: null,
    setReportJobId: (id) => set({ reportJobId: id }),

    reportLoading: false,
    setReportLoading: (loading) => set({ reportLoading: loading }),

    reportLayerVisible: false,
    setReportLayerVisible: (visible) => set({ reportLayerVisible: visible }),

    reportLayerData: null,
    setReportLayerData: (featureCollection) => set({ reportLayerData: featureCollection }),

    cachedAssets: null,
    setCachedAssets: (assets) => set({ cachedAssets: assets }),

    polygonStatus: 'none',
    setPolygonStatus: (status) => set({ polygonStatus: status }),

    layersPanelOpen: true,
    setLayersPanelOpen: (open) => set({ layersPanelOpen: open }),

    clearMarkerValues: () => set({ markerBearing: null, markerVariant: null, markerPosition: null, assetCount: 1 }),
    selectedScenario: null,
    setSelectedScenario: (scenario) => set({ selectedScenario: scenario, scenarioIsCustom: false }),

    scenarioIsCustom: false,
    setScenarioIsCustom: (isCustom) => set({ scenarioIsCustom: isCustom }),

    planningMode: 'scenarios',
    setPlanningMode: (mode) => set({ planningMode: mode }),

    creatingScenario: false,
    setCreatingScenario: (creating) => set({ creatingScenario: creating }),

    userScenariosVersion: 0,
    bumpUserScenariosVersion: () => set((state) => ({ userScenariosVersion: state.userScenariosVersion + 1 })),


    handleMapClick: (e: MapLayerMouseEvent) => {
        if (get().placing) {
            const { lngLat } = e;
            get().setMarkerPosition({ longitude: lngLat.lng, latitude: lngLat.lat });

            const mapRef = get().mapRef;
            if (mapRef) {
                get().setMarkerBearing(mapRef.getBearing());
            }

            get().setPlacing(false);
        }
    },
}));
