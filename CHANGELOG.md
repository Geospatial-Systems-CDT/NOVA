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

- Added predefined planning scenarios loaded from `frontend/public/data/scenarios.json` and a new scenario model contract in `frontend/src/types/scenario.ts`.
- Added a dedicated Scenario panel (`frontend/src/components/layer-selection/ScenarioPanel.tsx`) that:
  - Loads predefined scenarios from static JSON.
  - Merges predefined scenarios with user-created local scenarios.
  - Allows selecting a scenario to pre-fill layers and parameters.
  - Provides an `Add scenario` action to start custom scenario creation from current layer settings.
- Added exclusive planning modes (`scenarios` and `layers`) in map state and UI:
  - Top-left toggle in `MapComponent`.
  - Mutual exclusivity between Scenario panel and Layers panel to prevent overlap.
- Added user-created scenario persistence via browser local storage in `frontend/src/utils/scenarioStorage.ts`:
  - Safe load/validation.
  - Save/append for user scenarios.
  - User scenario id generation.

## Changes

- Extended map store (`frontend/src/stores/useMapStore.ts`) with scenario/planning workflow state:
  - `selectedScenario`
  - `planningMode`
  - `scenarioIsCustom`
  - `creatingScenario`
  - `userScenariosVersion`
- Updated layer control behaviour (`frontend/src/components/layer-selection/LayerControlPanel.tsx`) to:
  - Pre-fill checked layers and attribute values from selected scenario.
  - Preserve scenario-driven defaults on reset.
  - Show scenario mode indicator (`Predefined`/`User`) and `Customized` state.
  - Mark scenario as customised when layer selections or parameters are manually edited.
  - Save current layer configuration as a new user scenario.
- Updated map composition (`frontend/src/components/map/MapComponent.tsx`) to render only one planning panel at a time based on selected planning mode.

## Observability

- Added lightweight performance logging (`[perf]`) for new scenario/layer workflow elements:
  - Map initialisation time.
  - Time until planning controls are shown.
  - First-show timing for scenarios panel and layers panel.
  - Predefined scenario fetch duration and scenario panel readiness time.
  - Layer metadata fetch duration and layer panel readiness time.
  - User scenario save duration.

## Tests

- Added/updated frontend tests to cover scenario and planning mode behaviour:
  - `frontend/src/components/layer-selection/ScenarioPanel.spec.tsx`
  - `frontend/src/components/layer-selection/LayerControlPanel.spec.tsx`
  - `frontend/src/components/map/MapComponent.spec.tsx`
- Verified targeted test suite passes for the updated scenario/layer/map components.
