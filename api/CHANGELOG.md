# Changelog

All notable changes to this project will be documented in this file, following **Semantic Versioning**.

## v1.0.0 (Feature release)

### New features
**Initial release** of the User Details API with capability to:
  - Source user details from the `X-Auth-Request-Access-Token` header of inbound requests by calling the /v1/user-details endpoint.
  - Decode JWT tokens to inspect their contents by calling the /v1/jwt-decode endpoint.
  - Adjust API settings such as the default header name inspected for inbound tokens and claims returned through use of environment variables.

### Deprecated features
No deprecated features in this release.

### Fixes
- Improved issue hierarchy handling in map layer issue popups so only the highest-priority issue is shown per topic.
-Resolved duplicate/multi-level issue display where overlapping suitability levels (for example: dark red + red + amber) were shown at the same time for the same constraint.
-Enforced severity precedence in issue output:
  1.darkRed
  2.red
  3.amber

### Changes
Updated asset-analysis.service.ts to:
- Updated popup issue aggregation logic to group related issue variants by topic (for example: “close to”, “too close to”, and “inside” for the same layer family) and retain only the most severe one.
- Added/updated frontend unit tests covering:
  1.Highest-priority selection per issue topic.
  2.Suppression of lower-priority duplicate issue messages in popup content.

#### Changes from features/solar_data
Add solar potential and windspeed resource integration to analysis and MVP output estimation.

Introduce a backend-first, deterministic screening estimator across API and frontend.

Backend:
- Added `EnergyEstimationService` with deterministic, assumption-based screening logic.
- Added spatial resource lookups using `DataProviderUtils` + Turf point-in-polygon:
  - Solar: `pvout.geojson` (`pv_annual_kwh_kwp`) to derive solar capacity factor.
  - Wind: `windspeed.geojson` seasonal values (`ws_spring1`, `ws_summer1`, `ws_autumn1`, `ws_winter1`) to derive wind capacity factor.
- Added estimation DTOs: `asset-estimation-request` and `asset-estimation-response`.
- Added/updated UI endpoints:
  - `GET /api/ui/solar-potential`
  - `POST /api/ui/asset/estimate`
- Wired estimator service into `UIController` and routes.
- Updated API tests to construct `UIController` with the new estimator dependency.

Frontend:
- Integrated backend estimation in `GridConnectFooterPanel` using `POST /api/ui/asset/estimate`.
- Kept client-side estimation as fallback when backend estimation is unavailable.
- Added helper clients: `assetEstimationApi` and `solarPotentialApi`.
- Added unit tests for frontend energy estimation utility behavior.

Docs:
- Added and expanded the user guide method note with equations, constants, assumptions, and limitations.
- Documented data-source precedence (solar/wind lookup first, heuristic fallback second).

### Notes
- This change affects issue text shown in the frontend popup.
- Geometry layer generation/order from the API was not changed in this update.



© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.  
Licensed under the Open Government Licence v3.0.  
