# Changelog

**Repository:** `NOVA`
**Description:** `Tracks all notable changes, version history, and roadmap toward 1.0.0 following Semantic Versioning.`
**SPDX-License-Identifier:** `OGL-UK-3.0`

All notable changes to this repository will be documented in this file.

This project follows **Semantic Versioning (SemVer)** ([semver.org](https://semver.org/)), using the format:

- **MAJOR** (`X.0.0`) – Incompatible API/feature changes that break backward compatibility.
- **MINOR** (`0.X.0`) – Backward-compatible new features, enhancements, or functionality changes.
- **PATCH** (`0.0.X`) – Backward-compatible bug fixes, security updates, or minor corrections.
- **Pre-release versions** – Use suffixes such as `-alpha`, `-beta`, `-rc.1` (e.g., `2.1.0-beta.1`).
- **Build metadata** – If needed, use `+build` (e.g., `2.1.0+20250314`).

---

## [0.90.0] - 2026-02-18

## Features

- Privacy notice
- Power grid connectivity feature enabling substation selection and connectivity distance display (API + UI) (DPAV-1158).
- Base 3D mapping support and 3D asset view; asset panel; popups and properties panel.
- Heatmap functionality sourced from API data layers; limits and user parameter support for data layers (DPAV-1000, DPAV-994).
- Search bar (top-left) with initial behavior and refactored data-provider logic (DPAV-1129, DPAV-998).
- API services/endpoints for layers and search; associated unit tests and coverage improvements.
- UI enhancements: asset details hover popover and asset suitability hover icon (DPAV-1002).
- Data science module with initial ML algorithm for optimal location and docs/templates.

## Future Roadmap to `1.0.0`

The `0.90.x` series is part of NDTP’s **pre-stable development cycle**, meaning:

- **Minor versions (`0.91.0`, `0.92.0`...) introduce features and improvements** leading to a stable `1.0.0`.
- **Patch versions (`0.90.1`, `0.90.2`...) contain only bug fixes and security updates**.
- **Backward compatibility is NOT guaranteed until `1.0.0`**, though NDTP aims to minimise breaking changes.

Once `1.0.0` is reached, future versions will follow **strict SemVer rules**.

---

## Versioning Policy

1. **MAJOR updates (`X.0.0`)** – Typically introduce breaking changes that require users to modify their code or configurations.

- **Breaking changes (default rule)**: Any backward-incompatible modifications require a major version bump.
- **Non-breaking major updates (exceptional cases)**: A major version may also be incremented if the update represents a significant milestone, such as a shift in governance, a long-term stability commitment, or substantial new functionality that redefines the project’s scope.

2. **MINOR updates (`0.X.0`)** – New functionality that is backward-compatible.
3. **PATCH updates (`0.0.X`)** – Bug fixes, performance improvements, or security patches.
4. **Dependency updates** – A **major dependency upgrade** that introduces breaking changes should trigger a **MAJOR** version bump (once at `1.0.0`).

---

## How to Update This Changelog

1. When making changes, update this file under the **Unreleased** section.
2. Before a new release, move changes from **Unreleased** to a new dated section with a version number.
3. Follow **Semantic Versioning** rules to categorise changes correctly.
4. If pre-release versions are used, clearly mark them as `-alpha`, `-beta`, or `-rc.X`.

---

**Maintained by the National Digital Twin Programme (NDTP).**
© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
Licensed under the Open Government Licence v3.0.
For full licensing terms, see [OGL_LICENSE.md](OGL_LICENSE.md).

## [Unreleased]

## Features

**Report generation**

- Introduced report generation for a selected location, accessible from the search panel via a new report button.
- Added `ReportPage` as a dedicated routed page (`/report`) with print-optimised layout, satellite imagery, per-layer analysis assumptions, selected polygon geometry, and agricultural land classification (PAL) data.
- Print view button added to `ReportPage` with correct background colour for printing.
- Report generation runs asynchronously in the background; the map remains interactive while the report loads.
- Report data is cached in map store so the report page can be accessed after generation without re-requesting.

**Energy estimation**

- Added `assetEstimationApi.ts` and `solarPotentialApi.ts` service clients for backend energy estimation endpoints.
- Added client-side energy estimation utility (`energyEstimation.ts`); backend estimate used when available, client-side calculation retained as fallback.

**Scenario planning**

- Added predefined planning scenarios loaded from `public/data/scenarios.json` and a new scenario model in `src/types/scenario.ts`.
- Added `ScenarioPanel` component that loads predefined scenarios, merges with user-created scenarios, and allows a scenario to pre-fill layer selections and parameter values.
- Added `Add scenario` action to create a custom scenario from current layer settings.
- Introduced exclusive planning modes (`scenarios` / `layers`) toggled from the map, preventing the Scenario and Layers panels from being open simultaneously.
- Added `scenarioStorage.ts` for persisting user-created scenarios to browser local storage.

**Report layer toggle**

- Added a `View/Hide Report Layer` toggle next to the report button in the search controls to display report regions directly on the dashboard map.
- Added report-to-GeoJSON mapping to convert cached report regions into a popup-ready overlay layer.
- Added interactive report-region callouts on map click showing area, issue count, full issue list, and layer values.
- Added cached-report fallback logic so the report layer can be toggled from store or local storage data, with user guidance when report data is missing.

**Asset management**

- Extended `AssetMarker` and `PlacingMarkerOverlay` with solar asset type support.
- Added `assetIconResolver.ts` to resolve the correct map icon per asset type and variant.
- Extended `AddAssetPanel` with solar asset selection options.

## Fixes

- Fixed `MapVisualHelper` type error when classifying amber areas with a single issue.
- Corrected layer hierarchy resolution in `MapVisualHelper` for multi-level suitability classifications.
- Fixed layer conflict by hiding the model heatmap whenever report layer view is enabled, and restoring model heatmap when report layer view is disabled.

## Changes

- `MapVisualHelper` updated with visual support for road/rail and terrain constraint layers.
- `MapVisualHelper` extended with dedicated report overlay add/update/remove methods and report popup handling.
- `LayerControlPanel` updated to surface per-layer assumptions, support scenario-driven pre-selection, and trigger background report generation.
- `MapComponent` extended with planning mode toggle and report/model overlay switching behavior.
- Map store (`useMapStore.ts`) extended with report caching state and scenario/planning workflow state.
- Map store (`useMapStore.ts`) extended with report layer visibility/data state.
- `App.tsx` and `main.tsx` updated to register the `/report` route.
- updated road and rail buffers added caution buffer area for road and solar.
added the rest of layers.
## Tests

- Added/updated tests for `energyEstimation`, `ScenarioPanel`, `LayerControlPanel`, `MapComponent`, report UI components, and `MapVisualHelper`.
- Added tests for report-layer mapping and report overlay add/remove behavior in map utilities.
