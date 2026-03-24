// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { LngLat, MapMouseEvent, type Map, Popup, MercatorCoordinate } from 'maplibre-gl';
import type { Feature, FeatureCollection, Geometry, LineString, Polygon } from 'geojson';
import type { GeoJSONSource, SourceSpecification } from 'maplibre-gl';
import type { MapRef } from 'react-map-gl/maplibre';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Variation } from '../components/search/add-asset/AddAsset';
import { useMapStore } from '../stores/useMapStore';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

// Used to ensure mouse events include feature information. any type is used as property could be of any object.
type FeatureEvent = MapMouseEvent & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    features?: Feature<Geometry, { [key: string]: any }>[];
};

/**
 * Interface for a custom Three.js layer for MapLibre.
 */
interface ThreeJsCustomLayer extends maplibregl.CustomLayerInterface {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
}

interface GridLayer {
    id: string;
    endpoint: string;
    type: LayerType;
    data?: FeatureCollection;
    color: string;
}

type LayerType = 'symbol' | 'fill' | 'circle' | 'line' | 'raster' | 'heatmap' | 'fill-extrusion' | 'hillshade' | 'color-relief' | 'background';

function isLayerType(value: string): value is LayerType {
    return ['symbol', 'fill', 'circle', 'line', 'raster', 'heatmap', 'fill-extrusion', 'hillshade', 'color-relief', 'background'].includes(value);
}

/**
 * Helper class for applying map visualisations when using MapLibre GL.
 */
export class MapVisualHelper {
    // Unique ID for the source and layer used for masking
    private static readonly maskLayerSourceId = 'mask';
    private static readonly maskLayerId = 'mask-layer';
    private static readonly heatmapLayerId = 'heatmap-layer';
    private static readonly threeDimensionalAssetsLayer = '3d-assets-layer';
    private static readonly substationLayerId = 'substation-layer';
    private static readonly powerLineLayerId = 'power-line-layer';
    private static readonly connectionLineLayerId = 'connection-line-layer';
    private static readonly powerLineColor = '#007AFF';

    /**
     * Applies a dimmed mask over the entire map except inside the given polygon and centers the map on that polygon.
     * If the mask source or layer already exists, it will update them.
     *
     * @param map - The MapLibre map instance
     * @param polygon - A GeoJSON Polygon to act as the visible cutout
     */
    static applyDimmedMaskAndPanToPolygon(map: Map, polygon: Polygon) {
        const maskFeature: Feature<Polygon> = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [-180, -85],
                        [180, -85],
                        [180, 85],
                        [-180, 85],
                        [-180, -85],
                    ],
                    polygon.coordinates[0],
                ],
            },
            properties: {},
        };

        if (!map.getSource(this.maskLayerSourceId)) {
            map.addSource(this.maskLayerSourceId, {
                type: 'geojson',
                data: maskFeature,
            });
        } else {
            const source = map.getSource(this.maskLayerSourceId) as GeoJSONSource;
            source.setData(maskFeature);
        }

        if (!map.getLayer(this.maskLayerId)) {
            map.addLayer({
                id: this.maskLayerId,
                type: 'fill',
                source: this.maskLayerSourceId,
                paint: {
                    'fill-color': '#000000',
                    'fill-opacity': 0.5,
                },
            });
        }

        this.panToPolygon(map, undefined, polygon);
    }

    /**
     * Removes the mask layer and source from the map, if they exist.
     *
     * @param map - The MapLibre map instance
     */
    static removeDimmedMask(map: Map) {
        if (map.getLayer(this.maskLayerId)) map.removeLayer(this.maskLayerId);
        if (map.getSource(this.maskLayerSourceId)) map.removeSource(this.maskLayerSourceId);
    }

    /**
     * Calculates the position for a confirmation popup based on the polygon's coordinates.
     * The popup will be positioned at the average longitude and the maximum latitude of the polygon.
     *
     * @param polygon - The GeoJSON Polygon to base the popup position on
     * @param map - The React MapLibre map reference
     * @returns A [lng, lat] tuple of the suggested popup position
     */
    static getConfirmationPopupCoordinates(polygon: Polygon, map: Map): [number, number] {
        const coords = polygon.coordinates[0];
        const topLat = Math.max(...coords.map(([, lat]) => lat));
        const avgLng = coords.reduce((sum, [lng]) => sum + lng, 0) / coords.length;

        const point = map.project(new LngLat(avgLng, topLat));
        point.y -= 20;
        const offsetLngLat = map.unproject(point);
        return [offsetLngLat.lng, offsetLngLat.lat];
    }

    /**
     * Removes an existing popup from the map, if it exists.
     *
     * @param popupRef - A React ref to the popup instance
     */
    static removeExistingPopup(popup: Popup | null) {
        if (popup) popup.remove();
        useMapStore.getState().setPolygonConfirmPopup(null);
    }

    /**
     * Flies the map to a specific location with a smooth animation.
     *
     * @param mapRef - A React ref to the MapLibre map instance
     * @param lat - Latitude of the target location
     * @param lng - Longitude of the target location
     * @param zoom - Zoom level for the target location
     * @param duration - Duration of the flyTo animation in milliseconds (default is 2000ms)
     */
    static flyToLocation(lat: number, lng: number, zoom: number, duration = 2000) {
        const mapRef = useMapStore.getState().mapRef;
        const map = mapRef?.getMap();

        if (!map) return;
        map.flyTo({ center: [lng, lat], zoom, duration });
    }

    /**
     * Retrieves the first polygon from the Mapbox Draw instance.
     * If no polygon exists, returns null.
     *
     * @param draw - The Mapbox Draw polygon instance
     * @returns The first polygon geometry or null if none exists
     */
    static getFirstPolygon(draw: MapboxDraw): Polygon | null {
        const feature = (draw.getAll() as unknown as FeatureCollection).features[0];
        return feature?.geometry?.type === 'Polygon' ? (feature.geometry as Polygon) : null;
    }

    /**
     * Extracts the first polygon from a GeoJSON FeatureCollection.
     * If no polygon exists, returns null.
     *
     * @param geojson - The GeoJSON FeatureCollection to extract from
     * @returns The first polygon geometry or null if none exists
     */
    static extractFirstPolygon(geojson: FeatureCollection<Geometry>): Polygon | null {
        const geometry = geojson.features[0]?.geometry;
        return geometry?.type === 'Polygon' ? (geometry as Polygon) : null;
    }

    /**
     * Retrieves the entire feature collection from the Mapbox Draw instance.
     *
     * @param draw - The Mapbox Draw polygon instance
     * @returns The feature collection containing all drawn geometries
     */
    static getFeatureCollection(draw: MapboxDraw): FeatureCollection<Geometry> {
        return draw.getAll() as unknown as FeatureCollection<Geometry>;
    }

    /**
     * Adds or updates a polygon fill layer showing suitability scores on the map.
     * Also adds interactivity for click (issue descriptions).
     *
     * @param mapRef - A React ref to the MapLibre map instance
     * @param geojson - The FeatureCollection containing polygons with a "suitability" and "issues" property
     */
    static addOrUpdateHeatmapLayer(mapRef: React.RefObject<MapRef>, geojson: FeatureCollection) {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const id = this.heatmapLayerId;

        if (!map.getSource(id)) {
            map.addSource(id, { type: 'geojson', data: geojson });

            map.addLayer({
                id,
                type: 'fill',
                source: id,
                paint: {
                    'fill-color': ['match', ['get', 'suitability'], 'darkRed', '#881d11', 'red', '#e74c3c', 'amber', '#f39c12', 'green', '#27ae60', '#cccccc'],
                    'fill-opacity': ['match', ['get', 'suitability'], 'darkRed', 0.8, 'red', 0.7, 'amber', 0.4, 'green', 0.4, 0.6],
                    'fill-antialias': false,
                },
            });
        } else {
            const source = map.getSource(id) as GeoJSONSource;
            source.setData(geojson);
        }

        // Remove any previously bound events
        map.off('click', id, this._handleHeatmapLayerClick);

        // Add only click interaction
        map.on('click', id, this._handleHeatmapLayerClick);

        map.getCanvas().style.cursor = 'default';
    }

    /**
     * Removes the heatmap layer and its source from the map, if they exist.
     *
     * @param mapRef - A React ref to the MapLibre map instance
     */
    static removeHeatmapLayer(mapRef: React.RefObject<MapRef>) {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const id = this.heatmapLayerId;
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
    }

    static panToPolygon(map: Map, draw?: MapboxDraw, polygon?: Polygon | null) {
        if (!map || (!polygon && !draw)) return;

        if (!polygon) polygon = MapVisualHelper.getFirstPolygon(draw!);

        if (!polygon) return;

        const coords = polygon.coordinates[0];
        const lats = coords.map(([, lat]) => lat);
        const lngs = coords.map(([lng]) => lng);

        map.fitBounds(
            [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)],
            ],
            {
                padding: { top: 50, bottom: 50, left: 450, right: 66 },
                duration: 2000,
                bearing: map.getBearing(),
            }
        );
    }

    /**
     * Hides all non-base layers on the map and returns the IDs of those hidden layers.
     * Base layers are identified by names like 'background', 'tile', or 'basemap'.
     *
     * @param map - The MapLibre map instance
     * @returns An array of layer IDs that were hidden
     */
    static hideNonBaseLayers(map: Map): string[] {
        const allLayerIds = map.getStyle().layers?.map((layer) => layer.id) || [];
        const layersToHide = allLayerIds.filter((id) => id.startsWith('gl-') || id === MapVisualHelper.heatmapLayerId || id == MapVisualHelper.maskLayerId);

        const toHide = allLayerIds.filter((id) => layersToHide.includes(id));
        toHide.forEach((id) => {
            if (map.getLayer(id)) {
                map.setLayoutProperty(id, 'visibility', 'none');
            }
        });

        return toHide;
    }

    /**
     * Restores visibility for previously hidden layers.
     *
     * @param map - The MapLibre map instance
     * @param layerIds - Array of layer IDs to show
     */
    static showLayers(map: Map, layerIds: string[]) {
        layerIds.forEach((id) => {
            if (map.getLayer(id)) {
                map.setLayoutProperty(id, 'visibility', 'visible');
            }
        });
    }

    /**
     * Helper method to visualise assets placed on the map in 3d.
     * @param map  - The MapLibre map instance.
     */
    static async visualiseAssetsIn3d(
        map: Map,
        markerPosition: { longitude?: number; latitude?: number } | null,
        markerBearing: number | null,
        markerVariant: Variation | null
    ) {
        MapVisualHelper.remove3DAssets(map);

        const modelMap: Record<string, string> = {
            Vestas: 'models/turbine-a.glb',
            'Siemens Gamesa': 'models/turbine-b.glb',
        };

        const modelPath = modelMap[markerVariant?.name ?? ''];

        const { scene: model } = await new GLTFLoader().loadAsync(modelPath);
        model.scale.set(1, 1, 1);

        // Use the stored marker position if available, else don't render
        if (!markerPosition) {
            console.warn('No marker position set. Skipping visualisation.');
            return;
        }

        if (markerPosition.longitude === undefined || markerPosition.latitude === undefined) {
            console.warn('Marker position is missing longitude or latitude. Skipping visualisation.');
            return;
        }

        const position = new LngLat(markerPosition.longitude, markerPosition.latitude);
        const elevation = map.queryTerrainElevation(position) || 0;
        const origin = MercatorCoordinate.fromLngLat(position, elevation);
        const scale = origin.meterInMercatorCoordinateUnits();

        const layer = {
            id: MapVisualHelper.threeDimensionalAssetsLayer,
            type: 'custom' as const,
            renderingMode: '3d' as const,

            onAdd(_: Map, gl: WebGLRenderingContext) {
                const scene = new THREE.Scene();
                const camera = new THREE.Camera();

                scene.rotateX(Math.PI / 2);
                scene.scale.set(1, 1, -1);

                const light = new THREE.DirectionalLight(0xffffff, 1);
                light.position.set(100, 200, 100);
                scene.add(light, model);

                const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
                scene.add(ambientLight);

                if (markerBearing !== null && markerBearing !== undefined) {
                    const bearingInRadians = THREE.MathUtils.degToRad(markerBearing + 180);
                    model.rotation.y = bearingInRadians;
                }

                const renderer = new THREE.WebGLRenderer({
                    canvas: map.getCanvas(),
                    context: gl,
                    antialias: true,
                });
                renderer.autoClear = false;

                Object.assign(this, { scene, camera, renderer });
            },

            render(_: WebGLRenderingContext, { defaultProjectionData: { mainMatrix } }: { defaultProjectionData: { mainMatrix: number[] } }) {
                const proj = new THREE.Matrix4().fromArray(mainMatrix);
                const modelMatrix = new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z).scale(new THREE.Vector3(scale, -scale, scale));

                this.camera.projectionMatrix = proj.multiply(modelMatrix);
                this.renderer.resetState();
                this.renderer.render(this.scene, this.camera);
            },
        } as ThreeJsCustomLayer;

        map.addLayer(layer);

        map.easeTo({
            center: [markerPosition.longitude, markerPosition.latitude],
            zoom: 16.5,
            pitch: 60,
            bearing: markerBearing ?? 0,
            duration: 1000,
            offset: [0, 100], // shift map centre 100px down (so asset appears higher)
        });
    }

    /**
     * Removes all 3d assets from the map.
     */
    static remove3DAssets(map: Map) {
        if (map.getLayer(MapVisualHelper.threeDimensionalAssetsLayer)) map.removeLayer(MapVisualHelper.threeDimensionalAssetsLayer);
    }

    /**
     * Determines whether long/lat coordinates fall inside a user drawn polygon.
     */
    static isPointInsideUserDrawnPolygon(draw: MapboxDraw, lng: number, lat: number): boolean {
        const polygon = MapVisualHelper.getFirstPolygon(draw);
        if (!polygon) return true;

        const pt = point([lng, lat]);
        return booleanPointInPolygon(pt, polygon);
    }

    static async renderSubstationAndPowerLineLayers() {
        const substationLayer: GridLayer = { id: MapVisualHelper.substationLayerId, type: 'circle', endpoint: '/api/ui/substation-geojson', color: '#CF9FFF' };
        const powerLineLayer: GridLayer = {
            id: MapVisualHelper.powerLineLayerId,
            type: 'line',
            endpoint: '/api/ui/power-line-geojson',
            color: MapVisualHelper.powerLineColor,
        };

        const substationFeatureData = MapVisualHelper.fetchFeatureData(substationLayer);
        const powerLineFeatureData = MapVisualHelper.fetchFeatureData(powerLineLayer);

        await Promise.all([substationFeatureData, powerLineFeatureData]).then((allFeatureData) => {
            MapVisualHelper.setLayers(allFeatureData);
        });
    }

    static async fetchFeatureData(layerToFetch: GridLayer) {
        try {
            const response = await fetch(layerToFetch.endpoint);
            if (!response.ok) throw new Error('API error');
            const data = await response.json();
            layerToFetch.data = data;
            return layerToFetch;
        } catch (err) {
            console.error('Failed to load layers', err);
        }
    }

    static setLayers(layers: (GridLayer | undefined)[]) {
        const map = useMapStore.getState().mapRef?.getMap();
        if (!map) return;

        for (const layer of layers) {
            if (!layer || !layer.data) continue;
            if (!isLayerType(layer.type)) continue;
            if (!map.getSource(layer.id)) {
                const paint =
                    layer.type === 'circle'
                        ? { 'circle-radius': 8, 'circle-color': layer.color, 'circle-opacity': 0.8 }
                        : { 'line-color': layer.color, 'line-width': 4, 'line-opacity': 0.8 };
                const source: SourceSpecification = {
                    type: 'geojson',
                    data: layer.data,
                };

                map.addLayer({
                    id: layer.id,
                    type: layer.type as LayerType,
                    source: source,
                    paint: paint,
                });

                console.log(map.getSource(layer.id));
            } else {
                const source = map.getSource(layer.id) as GeoJSONSource;
                source.setData(layer.data);
            }
        }
    }

    static removeGridLayers = () => {
        MapVisualHelper.removeLayer(MapVisualHelper.connectionLineLayerId);
        MapVisualHelper.removeLayer(MapVisualHelper.powerLineLayerId);
        MapVisualHelper.removeLayer(MapVisualHelper.substationLayerId);
    };

    static removeLayer = (layerId: string) => {
        const map = useMapStore.getState().mapRef?.getMap();
        if (!map) return;

        if (map.getSource(layerId) && map.getLayer(layerId)) {
            map.removeLayer(layerId);
            map.removeSource(layerId);
        }
    };

    static renderGridConnectionLine() {
        const map = useMapStore.getState().mapRef?.getMap();
        const markerPosition = useMapStore.getState().markerPosition;
        const selectedSubstation = useMapStore.getState().selectedSubstation;
        if (!map || !markerPosition || !markerPosition.longitude || !markerPosition.latitude || !selectedSubstation || !selectedSubstation.coordinates) return;
        const layerId = this.connectionLineLayerId;
        const data: Feature<LineString> = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: [[markerPosition.longitude, markerPosition.latitude], selectedSubstation.coordinates],
            },
        };

        if (map.getSource(layerId)) {
            const source = map.getSource(layerId) as GeoJSONSource;
            source.setData(data);
        } else {
            map.addSource(layerId, {
                type: 'geojson',
                data: data,
            });

            // Add a layer to display the path
            map.addLayer({
                id: this.connectionLineLayerId,
                type: 'line',
                source: this.connectionLineLayerId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': this.powerLineColor,
                    'line-width': 2,
                    'line-dasharray': [2, 2],
                },
            });
        }
    }

    /**
     * Extracts the "issue" field from a polygon feature.
     *
     * @param feature - A GeoJSON feature to extract issues from
     * @returns A string array for an issue description (can be empty)
     */
    private static _parseIssueFromFeature(feature: Feature): string[] {
        const issue = feature.properties?.issue;
        return issue ? [issue] : [];
    }

    /**
     * Maps suitability values to hierarchy scores so only the highest-priority issue
     * per topic is shown in the popup.
     */
    private static _getSuitabilityScore(suitability: unknown): number {
        if (suitability === 'darkRed') return 3;
        if (suitability === 'red') return 2;
        if (suitability === 'amber') return 1;
        return 0;
    }

    /**
     * Normalizes issue strings into a stable topic key so related "close / too close / present"
     * variants can be compared by severity.
     */
    private static _getIssueTopicKey(issue: string): string {
        const normalizedIssue = issue.toLowerCase();

        if (normalizedIssue.includes('special area of conservation') || normalizedIssue.includes('special areas of conservation')) {
            return 'special-areas-of-conservation';
        }

        if (
            normalizedIssue.includes('site of special scientific interest') ||
            normalizedIssue.includes('sites of special scientific interest')
        ) {
            return 'sites-of-special-scientific-interest';
        }

        if (normalizedIssue.includes('built up area') || normalizedIssue.includes('built up areas')) {
            return 'built-up-areas';
        }

        if (normalizedIssue.includes('area of outstanding natural beauty') || normalizedIssue.includes('areas of outstanding natural beauty')) {
            return 'areas-of-outstanding-natural-beauty';
        }

        if (normalizedIssue.includes('windspeed')) {
            return 'windspeed';
        }

        if (normalizedIssue.includes('slope')) {
            return 'terrain-slope';
        }

        if (normalizedIssue.includes('aspect')) {
            return 'terrain-aspect';
        }

        return normalizedIssue;
    }

    /**
     * Returns at most one issue per topic, preferring darkRed over red over amber.
     */
    private static _getHighestPriorityIssues(features: Feature[]): string[] {
        const issuesByTopic = new Map<string, { issue: string; score: number }>();

        features.forEach((feature) => {
            const issue = feature.properties?.issue;
            if (!issue) return;

            const score = this._getSuitabilityScore(feature.properties?.suitability);
            const topicKey = this._getIssueTopicKey(issue);
            const existing = issuesByTopic.get(topicKey);

            if (!existing || score > existing.score) {
                issuesByTopic.set(topicKey, { issue, score });
            }
        });

        return Array.from(issuesByTopic.values()).map((entry) => entry.issue);
    }

    /**
     * Shows a popup when a polygon on the heatmap is clicked, listing all issues.
     *
     * @param e - Click event with feature context
     */
    private static _handleHeatmapLayerClick(e: FeatureEvent) {
        const map = e.target as Map;
        const features = e.features ?? [];
        if (features.length === 0) return;

        if (e.defaultPrevented) return;

        const target = e.originalEvent.target as HTMLElement;
        if (target?.tagName === 'IMG') {
            // It's a marker click — ignore this event
            return;
        }

        // Only respond to clicks on the heatmap layer
        const clickedFeatureInHeatmap = features.some((feature) => (feature as MapGeoJSONFeature).layer?.id === MapVisualHelper.heatmapLayerId);

        if (!clickedFeatureInHeatmap) {
            // Ignore clicks on markers or unrelated layers
            return;
        }

        const heatmapFeatures = features.filter((feature) => (feature as MapGeoJSONFeature).layer?.id === MapVisualHelper.heatmapLayerId);
        const uniqueIssues = MapVisualHelper._getHighestPriorityIssues(heatmapFeatures);
        const count = uniqueIssues.length;

        const html = `
            <div style="max-width: 250px;">
                <div style="font-weight: bold;">
                    ${count === 0 ? 'No issues found' : `${count} issue${count > 1 ? 's' : ''} found`}
                </div>
                ${count > 0 ? uniqueIssues.map((issue) => `<div style="margin-bottom: 4px;">${issue}</div>`).join('') : ''}
            </div>
        `;

        new Popup({ closeButton: true }).setLngLat(e.lngLat).setHTML(html).addTo(map);
    }
}
