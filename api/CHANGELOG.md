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
- Resolved duplicate/multi-level issue display where overlapping suitability levels (for example: dark red + red + amber) were shown at the same time for the same constraint.
- Enforced severity precedence in issue output:
  1. darkRed
  2. red
  3. amber

### Changes
Updated asset-analysis.service.ts to:
- Updated popup issue aggregation logic to group related issue variants by topic (for example: “close to”, “too close to”, and “inside” for the same layer family) and retain only the most severe one.
- Added/updated frontend unit tests covering:
  1. Highest-priority selection per issue topic.
  2. Suppression of lower-priority duplicate issue messages in popup content.

#### Changes from features/solar_data
Added solar potential and windspeed resource integration to analysis and MVP output estimation, with a backend-first deterministic screening estimator across API and frontend.

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
- Added and expanded the user guide methods note with equations, constants, assumptions, and limitations.
- Documented data-source precedence (solar/wind lookup first, heuristic fallback second).

Additional updates (terrain suitability):
- Added new terrain resource layers for suitability analysis:
  - `Aspect_WGS84.geojson`
  - `Slopes_WGS84.geojson`
- Added `Terrain` category to layer metadata (`layers.json`) with:
  - `Slope` layer and configurable `maxSlope` threshold (default: 30 degrees)
  - `Aspect` layer (categorical classes)
- Extended `DataProviderUtils` with terrain loaders:
  - `getAspectLayerData()`
  - `getSlopesLayerData()`
- Implemented terrain suitability logic in `AssetAnalysisService`:
  - Slope rule: red when slope exceeds configured `maxSlope`
  - Aspect rule for solar suitability:
    - amber for East/West classes (3, 7)
    - red for North/North-East/North-West classes (1, 2, 8)
- Updated issue topic normalization in frontend popup handling to include terrain topics (`slope`, `aspect`) so duplicate issue variants are still collapsed by severity.
- Refined terrain issue wording for clarity:
  - aspect messages now focus on aspect-only reasoning (no implied slope status)
  - slope message explicitly states unfavourable solar terrain due to steep slope
- Added/updated API tests for:
  - terrain data loading in `data-provider.utils.spec.ts`
  - slope/aspect suitability behavior in `asset-analysis.service.spec.ts`

Latest refinements (estimation and display):
- Updated capacity parsing so any positive parsed asset specification value is used directly (including small solar W/kW-scale values), with fallback values used only when parsing is missing or non-positive.
- Synced API asset specification values with UI-displayed asset values to avoid mismatch during contribution estimation checks.
- Aligned wind asset specification schema and values between API and frontend datasets; added optional wind estimator parameters (`Power Coefficient (Cp)`, `Air Density (kg/m3)`, `Rated wind speed`) while retaining core capacity/rotor inputs.
- Updated wind estimation to use a seasonal physics-based method with `ws_spring1`/`ws_summer1`/`ws_autumn1`/`ws_winter1` and `P = 0.5 * rho * A * v^3 * Cp`, including cut-in/cut-out handling and rated-cap clipping.
- Migrated solar estimation from pvout-derived capacity factor to orientation-based MCS-style output using `annual kWh = kWp * Kk * SF` with `SF = 1.0`.
- Added backend solar Kk lookup data (`solar-kk.json`) and request support for optional `solarOrientation`.
- Added UI API route for supported orientations: `GET /api/ui/solar-orientations`.
- Updated frontend estimation flow to pass `solarOrientation` to backend and to use the same Kk-orientation logic in fallback estimation.
- Added multi-asset estimation support with `assetCount` (default 1) in the footer panel for both wind and solar scenarios.
- Extended estimation request contracts (frontend API client + backend DTO) to include optional `assetCount`.
- Updated backend and frontend fallback estimators to scale contribution outputs for multiple identical assets using a single-substation screening assumption.
- Fixed wind multi-asset scaling so turbine count multiplies computed annual energy consistently (not only rated-cap clipping behavior).
- Improved low-output visibility by increasing precision/scaling handling for small estimated values.
- Updated frontend footer display to use adaptive units for small values:
  - energy below 1 MWh is shown in kWh/year
  - power below 1 MW is shown in kW
- Updated methods documentation to reflect the current wind/solar estimator methodology, assumptions, fallback behavior, and multi-asset scaling.

### Notes
- This change affects issue text shown in the frontend popup.
- Geometry layer generation/order from the API was not changed in this update.
- Solar and wind support icon changes
- Added roads and rail geojson and buffer in system
© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.  
Licensed under the Open Government Licence v3.0.  
