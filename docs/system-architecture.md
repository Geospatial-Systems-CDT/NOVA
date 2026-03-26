# System Architecture and Components

## Overview

NOVA is a three-tier web application composed of a React frontend, a Node.js REST API backend, and a Python data-science service. These communicate over HTTP and are containerised for deployment via Docker and Kubernetes.

```
┌────────────────────────────────────────────────────────────────┐
│                        User (Browser)                          │
└──────────────────────────┬─────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼─────────────────────────────────────┐
│                     Frontend (Vite / React)                    │
│  Port 5173 (dev) · MapLibre GL · Deck.gl · MUI · Zustand       │
└──────────────┬─────────────────────────────┬───────────────────┘
               │ REST /api/*                 │ REST /api/ui/*
┌──────────────▼──────────────┐  ┌───────────▼───────────────────┐
│   API Backend (Node / TS)   │  │  Data Science (Python / Flask) │
│   Port 3000                 │  │  Port 5000                     │
│   Express · GeoJSON data    │  │  ML location optimiser         │
└──────────────────────────────┘  └───────────────────────────────┘
```

---
## Layers
The system uses a series of GeoJSON vector tiles that contain proximity and contextual information for geographic features intersecting the user-selected polygon.

The following layers are currently used:

- Areas of Outstanding Natural Beauty
- Sites of Special Scientific Interest
- Special Areas of Conservation
- Ancient Woodland
- Scheduled Ancient Monuments
- Special Protection Areas
- Ramsar Wetlands
- Coastal Erosion
- Built Up Areas
- Fuel Poverty Areas
- Dissolved Rivers (Flood Risk Areas)
- Agricultural Land Classification
- Roads within 100m
- Roads within 5/7m
- Railways within 100m
- Railways within 5m
- Mean Wind Speed
- Photovoltaic Potential
- Terrain Slope
- Terrain Aspect
- Unsuitable Land

These layers can be selected by using the layer panel checkboxes in the UI.


## Frontend (`frontend/`)

**Technology stack:** TypeScript, React 19, Vite, Material UI (MUI), MapLibre GL JS, Deck.gl, Zustand, Turf.js.

| Directory | Purpose |
|-----------|---------|
| `src/components/` | UI components (map, panels, search, polygon, report, grid-connect) |
| `src/pages/` | Top-level routed pages (`MapPage`, `ReportPage`) |
| `src/stores/` | Global state via Zustand (`useMapStore`) |
| `src/services/` | HTTP client wrappers for API endpoints |
| `src/hooks/` | Shared React hooks |
| `src/utils/` | Client-side utilities (energy estimation, map helpers) |
| `src/types/` | Shared TypeScript type definitions |
| `public/data/` | Static JSON assets (scenarios, assets config) |

**Key responsibilities:**

- Renders an interactive MapLibre GL map with selectable constraint layers, mentioned above
- Collects a user-drawn polygon, sends it to the API for analysis, and renders suitability results for intersecting areas.
- Hosts the report page (`/report`) with a print-optimised layout and per-layer analysis assumptions.
- Manages scenario planning workflows and asset variant (Wind Turbines: Vestas or Siemens Gamesa, Solar Panel: Roof or Farm) selection.

---

## API Backend (`api/`)

**Technology stack:** TypeScript, Node.js, Express, Jest.

| Directory | Purpose |
|-----------|---------|
| `src/controllers/` | HTTP handler classes (`AuthController`, `UIController`, `HealthController`) |
| `src/services/` | Business logic (`AssetAnalysisService`, `SubstationService`, `EnergyEstimationService`, `ReportJobStore`) |
| `src/routes/` | Express router definitions wiring controllers to paths |
| `src/middleware/` | Auth and error-handling middleware |
| `src/utils/` | `DataProviderUtils` — loads and caches GeoJSON data files |
| `src/data/` | GeoJSON constraint layer files and `layers.json` layer catalogue |
| `src/config/` | Environment variable validation and Swagger setup for ip based local or network viewing. |

**Key endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Liveness probe |
| `POST` | `/api/ui/location/analyse` | Run constraint analysis for a polygon; returns a job ID |
| `GET` | `/api/ui/location/report/:jobId` | Poll for async report result |
| `POST` | `/api/ui/asset/estimate` | Energy output estimate for a placed asset |
| `GET` | `/api/ui/solar-potential` | Solar irradiance lookup at a coordinate |
| `GET` | `/api/ui/layers` | Return the full layer catalogue from `layers.json` |
| `GET` | `/api/ui/search` | Location/feature search |

### Endpoint reference

#### `GET /api/health`

- Purpose: lightweight liveness probe used by local development checks and deployment health probes.
- Inputs: none.
- Outputs:
    - `200 OK`: service health payload.

#### `GET /api/ui/search`

- Purpose: returns location matches for the search box.
- Inputs:
    - query parameter `location: string`.
- Outputs:
    - `200 OK`: `SearchOptionDTO[]`
        - `name: string`
        - `latitude: number`
        - `longitude: number`
        - `zoom: number`
    - `400 Bad Request`: missing `location`.
- Example:

```json
[
    {
        "name": "Newport, Isle of Wight",
        "latitude": 50.701,
        "longitude": -1.291,
        "zoom": 12
    }
]
```

#### `GET /api/ui/layers`

- Purpose: returns the layer catalogue shown in the layer-selection panel.
- Inputs: none.
- Outputs:
    - `200 OK`: `LayersDTO`
        - `categories: CategoryDTO[]`
        - each category contains `items`, and each item contains `id`, `name`, and `attributes`
    - `500 Internal Server Error`: layer catalogue could not be loaded.
- Example:

```json
{
    "categories": [
        {
            "name": "Rural constraints",
            "items": [
                {
                    "id": "unsuitableLand",
                    "name": "Unsuitable Land",
                    "attributes": []
                }
            ]
        }
    ]
}
```

#### `POST /api/ui/location/analyse`

- Purpose: performs suitability analysis over a user-selected polygon.
- Inputs:
    - `location: FeatureCollection<Polygon>`
    - `dataLayers: DataLayerDto[]`
    - `maxIssues?: number`
- Outputs:
    - `200 OK`
        - `heatmap: FeatureCollection`
        - `jobId: string | null`
    - `400 Bad Request`: invalid GeoJSON payload.
    - `500 Internal Server Error`: analysis failed.
- Notes:
    - `jobId` is only created when `maxIssues` is supplied.
    - the report itself is not returned here; the client must poll using the returned `jobId`.
- Example:

```json
{
    "heatmap": {
        "type": "FeatureCollection",
        "features": []
    },
    "jobId": "1f6b4d02-6ddf-45ec-a9d6-4cb00d8f4f31"
}
```

#### `GET /api/ui/location/report/:jobId`

- Purpose: polls an asynchronous report-generation job.
- Inputs:
    - path parameter `jobId: string`
- Outputs:
    - `202 Accepted`: `{ "status": "pending" }`
    - `200 OK`: `{ "status": "complete", "report": ReportDTO }`
    - `404 Not Found`: `{ "error": "Report job not found or expired" }`
    - `500 Internal Server Error`: `{ "status": "error", "message": string }`
- Report shape:
    - `regions: ReportRegionDTO[]`
    - `totalRegions: number`
    - `selectedPolygon: Feature<Polygon> | null`
    - `assumptions: ReportAssumptionDTO[]`
- Example:

```json
{
    "status": "complete",
    "report": {
        "regions": [
            {
                "id": "region-1",
                "bbox": [-1.33, 50.65, -1.31, 50.67],
                "areaSqKm": 0.42,
                "issueCount": 1,
                "issues": [
                    {
                        "description": "Too close to built up areas",
                        "suitability": "amber"
                    }
                ],
                "layerValues": []
            }
        ],
        "totalRegions": 1,
        "selectedPolygon": null,
        "assumptions": []
    }
}
```

#### `GET /api/ui/solar-potential`

- Purpose: returns solar potential at a coordinate.
- Inputs:
    - query parameter `longitude: number`
    - query parameter `latitude: number`
- Outputs:
    - `200 OK`: `{ "pvAnnualKwhPerKwp": number | null }`
    - `400 Bad Request`: invalid or missing coordinates.
    - `500 Internal Server Error`: solar-potential lookup failed.

#### `GET /api/ui/solar-orientations`

- Purpose: returns the allowed solar orientation values used by the estimator.
- Inputs: none.
- Outputs:
    - `200 OK`: `{ "orientations": string[] }`
    - `500 Internal Server Error`: orientation lookup failed.

#### `POST /api/ui/asset/estimate`

- Purpose: estimates annual energy contribution and derived grid metrics for a selected asset/substation pairing.
- Inputs:
    - `variant: EstimationVariationDto | null`
    - `selectedSubstation`
        - `id: number`
        - `name: string`
        - `distanceFromTurbine: string | number`
        - `coordinates: number[]`
    - `latitude: number`
    - `longitude: number`
    - `solarOrientation?: string`
    - `assetCount?: number`
- Outputs:
    - `200 OK`: `AssetEstimationResponseDto`
        - `assetId`
        - `technology`
        - `location`
        - `connectedSubstation`
        - `connectionDistanceKm`
        - `outputMWh`
        - `outputMW`
        - `gridSupportMW`
        - `boostPercent`
        - `localBoostPercent`
        - `maxOutputMWh`
        - `maxOutputMW`
        - `maxGridSupportMW`
        - `maxBoostPercent`
        - `maxLocalBoostPercent`
    - `400 Bad Request`: invalid estimation payload.
    - `500 Internal Server Error`: estimation failed.
- Example:

```json
{
    "assetId": "SP-515",
    "technology": "solar",
    "location": "50.6663, -1.3171",
    "connectedSubstation": "SEPD",
    "connectionDistanceKm": 2.71,
    "outputMWh": 5157.0,
    "outputMW": 0.5887,
    "gridSupportMW": 0.5696,
    "boostPercent": 0.9,
    "localBoostPercent": 7.4,
    "maxOutputMWh": 6961.95,
    "maxOutputMW": 0.8242,
    "maxGridSupportMW": 0.7974,
    "maxBoostPercent": 100,
    "maxLocalBoostPercent": 100
}
```

#### `POST /api/ui/substations`

- Purpose: returns nearby substations for a supplied point.
- Inputs:
    - either `{ "latitude": number, "longitude": number }`
    - or a valid GeoJSON payload representing a point geometry
- Outputs:
    - `200 OK`: `LocationsDTO[]`
        - `id: number`
        - `location: Feature`
        - `name: string`
        - `distance: number`
    - `400 Bad Request`: invalid geometry or unresolved point.
    - `500 Internal Server Error`: substation lookup failed.

**Analysis flow:**

1. `UIController` receives a polygon and active layer list via `POST /api/ui/location/analyse`.
2. The request is dispatched to `AssetAnalysisService.getMatchedPolygonsForLayers()`.
3. For each active layer, `DataProviderUtils` loads the corresponding GeoJSON file and a Turf point-in-polygon / intersection check is performed.
4. Results are colour-coded (darkRed / red / amber / green) and returned as a structured suitability response.

---

## Data Science Service (`data-science/`)

**Technology stack:** Python, Flask.

A standalone Flask application exposing an ML-based optimal location algorithm. It runs independently of the main API and is consumed by the frontend or API as needed.

| Item | Detail |
|------|--------|
| Entry point | `app.py` |
| Template | `templates/index.html` |
| Dependencies | `requirements.txt` |

---

## Deployment (`deployment/`)

NOVA is containerised and can be built as separate frontend and backend images, then deployed via Kustomize-managed Kubernetes overlays. Local development is primarily driven by the workspace npm scripts rather than a repository-level Docker Compose definition.

| Path | Purpose |
|------|---------|
| `Dockerfile.backend` | Multi-stage build for the API backend |
| `Dockerfile.frontend` | Multi-stage build for the React frontend |
| `deployment/docker/` | Per-service Docker build and publish scripts |
| `deployment/k8s/` | Kubernetes manifests (backend, frontend, bootstrap) |

### Local build and run flow

1. Install workspace dependencies from the repository root.
2. Build both applications with `npm run build`.
3. Run `npm run start` for the normal local development workflow.
4. Build images separately when validating container packaging.

### What the Docker files do

- `Dockerfile.backend`
    - starts from `node:24-alpine`
    - installs production dependencies from `api/package*.json`
    - copies built server output from `api/dist`
    - runs as the non-root `node` user on port `3000`
- `Dockerfile.frontend`
    - starts from `nginxinc/nginx-unprivileged`
    - copies `frontend/dist` into the nginx web root
    - serves the static frontend bundle

### What the helper scripts do

- `deployment/docker/backend/build.sh`: builds the backend image as `nova/api`
- `deployment/docker/backend/publish.sh`: logs into AWS ECR, tags the backend image, and pushes it to the `nova/api` repository in `eu-west-2`
- `deployment/docker/frontend/build.sh`: builds the frontend image as `nova/frontend`
- `deployment/docker/frontend/publish.sh`: logs into AWS ECR, tags the frontend image, and pushes it to the `nova/frontend` repository in `eu-west-2`

### Kubernetes structure

- `deployment/k8s/backend/base`: backend deployment, service, service account, Vault integration, and ingress authorization policy
- `deployment/k8s/frontend/base`: frontend deployment, service, service account, and ingress authorization policy
- `deployment/k8s/bootstrap/base`: namespace, gateway, request-authentication, peer-authentication, and shared virtual-service resources
- `deployment/k8s/*/overlays/{dev,staging,prod}`: environment-specific Kustomize overlays and patches

### Typical deployment sequence

1. Build frontend and backend artifacts.
2. Build versioned container images.
3. Push images to the target registry.
4. Update overlay references or pipeline-supplied image values.
5. Apply the `bootstrap`, `backend`, and `frontend` Kustomize overlays for the target environment.
6. Validate gateway routing, authentication, pod health, and service reachability.

### Operational notes

- backend deployment assumes supporting platform services such as Vault and Istio are available
- authentication behavior differs between local development and cluster deployment because production-style auth relies on injected proxy headers
- image publishing is handled by shell scripts or CI/CD automation rather than by Kubernetes manifests directly

### Local development ports

| Service | Port |
|---------|------|
| API backend | 3000 |
| Frontend (Vite dev) | 5173 |
| MkDocs docs | 8000 |

---

## Inter-service Communication

All inter-service calls are plain HTTP REST. There is no message queue or event bus in the current architecture. The frontend proxies API requests through the Vite dev server to avoid CORS issues in development; in production, both services are served behind the same ingress.

---

## Authentication

Authentication is handled via an OAuth2 proxy (Vouch/OAuth2 Proxy in the Kubernetes deployment). The API reads the `X-Auth-Request-Access-Token` header injected by the proxy and decodes the JWT to extract user identity. The `/api/health` endpoint is unauthenticated.
