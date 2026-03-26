# Estimated Output Contribution - MVP Method Note

## Purpose

This section describes how NOVA currently computes the Estimated output contribution values after an asset is connected to a selected substation.

The current implementation utalizes calculations performed on the backend and returned to the UI. It is suitable for screening and demonstration, not for investment-grade engineering decisions.

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

- Hours per year: 8760 h/year
- Availability factor: 0.97 (dimensionless fraction)
- Losses factor: 0.12 (dimensionless fraction)
- Default capacity factor:
  - Wind: 0.34 (34%)
  - Solar: 0.14 (14%)
  - Unknown: 0.22 (22%)
- Default installed capacity (fallback):
  - Wind: 5 MW
  - Solar: 1 MW
  - Unknown: 2 MW
- Assumed substation headroom: 60 MW
- Assumed local demand: 8 MW
- Asset count default: 1 asset
- Solar shading factor (SF): 1.0 (dimensionless multiplier)
- Default solar orientation: south
- Default wind physical parameters:
  - Air density ($\rho$): 1.225 kg/m^3
  - Power coefficient ($C_p$): 0.45 (dimensionless fraction)
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

$$
P_{installed,kWp} = P_{installed,MW} \times 1000
$$

$$
E_{solar,kWh/year} = P_{installed,kWp} \times Kk \times SF
$$

- The estimator currently uses SF = 1.0.
- The value is converted to MWh for downstream processing.

$$
E_{solar,MWh/year} = \frac{E_{solar,kWh/year}}{1000}
$$

Wind (primary method)

- Seasonal wind speed is read from ws_spring1, ws_summer1, ws_autumn1, ws_winter1.
- Rotor swept area is computed from rotor diameter specification.
- Seasonal turbine power uses:

$$
A = \pi \left(\frac{D}{2}\right)^2
$$

$$
P = 0.5 \times \rho \times A \times v^3 \times C_p
$$

- Per-season power is set to 0 outside cut-in/cut-out speeds.
- Per-season power is capped at installed/rated capacity.
- Annual gross energy is the sum of seasonal power x hours per season.

Fallback behavior

- If required solar or wind inputs are missing, the estimator falls back to a latitude-adjusted capacity-factor method.
- Unknown technology always uses bounded default capacity-factor behavior.

Multi-asset scaling

- The estimator first computes gross annual energy for one asset using the selected technology path.
- Total gross annual energy is then scaled by asset count:

$$
E_{gross,total} = E_{gross,single} \times assetCount
$$

- The same selected substation and connection-distance context are used for all assets in this MVP (single-substation screening assumption).

### 3) Compute annual delivered energy

Gross annual energy:

$$
E_{gross} = P_{installed} \times 8760 \times CF
$$

For multi-asset runs:

$$
E_{gross,total} = E_{gross,single} \times assetCount
$$

Availability adjustment:

$$
E_{available} = E_{gross,total} \times 0.97
$$

Losses adjustment:

$$
E_{net} = E_{available} \times (1 - 0.12)
$$

Distance delivery factor:

$$
deliveryFactor = clamp(1 - 0.004 \times distance_{km}, 0.75, 1.0)
$$

Delivered annual energy:

$$
E_{delivered} = E_{net} \times deliveryFactor
$$

### 4) Convert to displayed metrics

- To local distribution network (MW):

$$
outputMW = \frac{E_{delivered}}{8760}
$$

- Grid support (MW):

$$
gridSupportFactor = clamp(1 - 0.012 \times distance_{km}, 0.35, 1.0)
$$

$$
gridSupportMW = outputMW \times gridSupportFactor
$$

- Boost to substation capacity (%):

$$
boostPercent = clamp\left(\frac{gridSupportMW}{60} \times 100, 0, 100\right)
$$

- Local self-sufficiency (%):

$$
localBoostPercent = clamp\left(\frac{outputMW}{8} \times 100, 0, 100\right)
$$

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

Implications and possible next steps:

1. Weather simplification can overstate or understate yield for site-specific scenarios.
  Future improvement: use hourly weather and irradiance data for scenario-based estimation.
2. Network simplification means the reported support values are screening indicators rather than power-flow results.
  Future improvement: integrate explicit network constraints and flow modelling.
3. Fixed headroom and demand assumptions may diverge from real operational conditions.
  Future improvement: connect to curated or live substation-capacity datasets.
4. Heuristic specification parsing can misread installed capacity when source metadata is inconsistent.
  Future improvement: normalize asset specifications into typed fields at source.
5. Fixed shading can overestimate solar output on constrained or partially obstructed sites.
  Future improvement: include terrain, obstruction, and orientation-aware shading effects.
6. Annual Kk values are useful for screening but cannot explain seasonal or intra-day generation behavior.
  Future improvement: add time-resolved solar modelling.
7. Simplified wind physics can miss hub-height, turbulence, wake, and turbine power-curve effects.
  Future improvement: add hub-height correction and manufacturer power curves.
8. Single-substation assumptions can underrepresent alternative connection strategies for larger schemes.
  Future improvement: support multi-substation comparison and routing options.

