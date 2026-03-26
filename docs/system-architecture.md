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

Areas of Outstanding Natural Beauty 

Sites of Special Scientific Interest 

Special Areas of Conservation 

Ancient Woodland 

Scheduled Ancient Monuments 

Special Protection Areas 

Ramsar Wetlands 

Coastal Erosion 

Built Up Areas  

Fuel Poverty Areas 

Dissolved Rivers (Flood Risk Areas) 

Agricultural Land Classification  

Roads within 100m 

Roads within 5/7m 

Railways within 100m 

Railways within 5m 

Mean Wind Speed 

Photovoltaic Potential 

Terrain Slope 

Terrain Aspect

These layers can be selected by using the layer panel checkboxes in the UI.


## Frontend (`frontend/`)

**Technology stack:** TypeScript, React 18, Vite, Material UI (MUI), MapLibre GL JS, Deck.gl, Zustand, Turf.js.

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

NOVA is containerised and can be run locally with Docker Compose or deployed to a Kubernetes cluster.

| Path | Purpose |
|------|---------|
| `Dockerfile.backend` | Multi-stage build for the API backend |
| `Dockerfile.frontend` | Multi-stage build for the React frontend |
| `deployment/docker/` | Per-service Docker build and publish scripts |
| `deployment/k8s/` | Kubernetes manifests (backend, frontend, bootstrap) |

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
