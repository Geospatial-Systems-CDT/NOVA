# Estimated Output Contribution - MVP Method Note

## Purpose

This note describes how NOVA currently computes the Estimated output contribution values after an asset is connected to a selected substation.

The current implementation is deterministic and assumption-based, with calculations performed on the backend and returned to the UI. It is suitable for screening and demonstration, not for investment-grade engineering decisions.

## Implementation Location

- Core calculation logic: api/src/services/energy-estimation.service.ts
- Estimation API endpoint: POST /api/ui/asset/estimate
- Solar orientation options endpoint: GET /api/ui/solar-orientations
- API controller wiring: api/src/controllers/ui.controller.ts and api/src/routes/ui.routes.ts
- UI consumer of backend result: frontend/src/components/grid-connect/GridConnectFooterPanel.tsx
- Frontend fallback utility (used only if API call fails): frontend/src/utils/energyEstimation.ts

## Inputs Used

1. Selected asset variant (wind or solar metadata and specification text)
2. Marker location (latitude, longitude)
3. Selected substation (name, id, connection distance)
4. Asset count (integer, default: 1)
5. Solar panel orientation (cardinal value; default: south)
6. Wind speed at location (seasonal fields from windspeed.geojson), when available

## Constants and Assumptions

- Hours per year: 8760
- Availability factor: 0.97
- Losses factor: 0.12
- Default capacity factor:
  - Wind: 0.34
  - Solar: 0.14
  - Unknown: 0.22
- Default installed capacity (fallback):
  - Wind: 5 MW
  - Solar: 1 MW
  - Unknown: 2 MW
- Assumed substation headroom: 60 MW
- Assumed local demand: 8 MW
- Asset count default: 1
- Solar shading factor (SF): 1.0
- Default solar orientation: south
- Default wind physical parameters:
  - Air density (rho): 1.225 kg/m3
  - Power coefficient (Cp): 0.45
  - Cut-in wind speed: 3 m/s
  - Cut-out wind speed: 25 m/s

## Calculation Logic

### Data source precedence

- Solar annual energy source order:
  1. Orientation lookup from Kk dictionary (cardinal values from api/src/data/solar-kk.json)
  2. Fallback to latitude-adjusted default solar capacity factor
- Wind annual energy source order:
  1. Location lookup from windspeed.geojson using ws_spring1, ws_summer1, ws_autumn1, ws_winter1 and turbine physical model
  2. Fallback to latitude-adjusted default wind capacity factor

### 1) Determine technology and capacity

- Technology is inferred from selected variant metadata (keywords in name/spec text/icon paths).
- Installed capacity is parsed from specification fields such as Capacity, Rated Power, or Wattage.
- The parsed specification value is used directly when it is a valid positive power value (including small installations, for example 250 W or 5 kW).
- Fallback capacity is only used when capacity cannot be parsed (or is non-positive):
  - Wind fallback: 5 MW
  - Solar fallback by variant label: Farm = 5 MW, Roof = 0.35 MW
  - Unknown fallback: 2 MW

### 2) Compute gross annual energy by technology

Solar (primary method)

- Installed capacity is converted from MW to kWp.
- Kk is looked up from orientation (for example: south=1023, south_west=962).
- Annual AC energy is computed as:

E_solar_kWh = kWp x Kk x SF

- The estimator currently uses SF = 1.0.
- The value is converted to MWh for downstream processing.

Wind (primary method)

- Seasonal wind speed is read from ws_spring1, ws_summer1, ws_autumn1, ws_winter1.
- Rotor swept area is computed from rotor diameter specification.
- Seasonal turbine power uses:

P = 0.5 x rho x A x v^3 x Cp

- Per-season power is set to 0 outside cut-in/cut-out speeds.
- Per-season power is capped at installed/rated capacity.
- Annual gross energy is the sum of seasonal power x hours per season.

Fallback behavior

- If required solar or wind inputs are missing, the estimator falls back to a latitude-adjusted capacity-factor method.
- Unknown technology always uses bounded default capacity-factor behavior.

Multi-asset scaling

- The estimator first computes gross annual energy for one asset using the selected technology path.
- Total gross annual energy is then scaled by asset count:

E_gross_total = E_gross_single x assetCount

- The same selected substation and connection-distance context are used for all assets in this MVP (single-substation screening assumption).

### 3) Compute annual delivered energy

Gross annual energy:

E_gross = P_installed x 8760 x CF

For multi-asset runs:

E_gross_total = E_gross_single x assetCount

Availability adjustment:

E_available = E_gross_total x 0.97

Losses adjustment:

E_net = E_available x (1 - 0.12)

Distance delivery factor:

deliveryFactor = clamp(1 - 0.004 x distance_km, 0.75, 1.0)

Delivered annual energy:

E_delivered = E_net x deliveryFactor

### 4) Convert to displayed metrics

- To local distribution network (MW):

outputMW = E_delivered / 8760

- Grid support (MW):

gridSupportFactor = clamp(1 - 0.012 x distance_km, 0.35, 1.0)

gridSupportMW = outputMW x gridSupportFactor

- Boost to substation capacity (%):

boostPercent = clamp((gridSupportMW / 60) x 100, 0, 100)

- Local self-sufficiency (%):

localBoostPercent = clamp((outputMW / 8) x 100, 0, 100)

- Values are rounded for display with low-value precision preserved in the estimator payload.
- UI unit adaptation for small values:
  - If annual energy < 1 MWh, display as kWh/year.
  - If power < 1 MW, display as kW.
  - Otherwise display in MWh/year and MW.

## Worked Example (from observed UI output)

Inputs:

- Asset ID: SP-515
- Location: 50.6663, -1.3171
- Connected Substation: SEPD
- Connection distance: 2.71 km

Observed output:

1. Projected into SEPD load: +5,157 MWh/year
2. To local distribution network: +0.6 MW
3. Grid support: +0.6 MW
4. Boost to substation capacity: +0.9%
5. Local self-sufficiency: +7.4%

Interpretation:

- The asset is treated as solar.
- Installed capacity comes from the selected specification value (or fallback only if not parseable), then is converted to kWp for the solar Kk equation.
- Solar orientation selects the Kk value used in annual energy estimation.
- Availability, losses, and short-distance penalties are applied.
- Output represents the selected number of identical assets, all assumed connected to the same selected substation.
- MWh/year is converted to MW and then normalized against assumed headroom and local demand to get percentages.

## Known Limitations

1. No hourly weather time series or plant-specific performance model
2. No explicit network power-flow or operational constraints
3. No measured substation headroom/load profile in this MVP
4. Some asset specs are text-only and parsed heuristically
5. Solar currently uses a fixed shading factor SF = 1.0
6. Solar uses orientation-based annual Kk values; it does not yet model hourly irradiance, temperature, or tilt as dynamic time-series inputs
7. Wind uses seasonal-average wind speeds and simplified physical assumptions; it does not include hub-height correction or full manufacturer power-curve interpolation
8. Multi-asset mode assumes all assets connect to one selected substation with shared connection context

## Recommended Next Step to Reach Production-Grade Estimation

Replace the fixed assumptions with data-driven inputs:

1. Real asset engineering parameters (per variant)
2. Location-specific resource datasets (wind/solar time series)
3. Substation/network headroom and constraint data
4. Explicit curtailment and losses model
5. Validation against measured generation where available
