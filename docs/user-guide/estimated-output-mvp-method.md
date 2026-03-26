# Estimated Output Contribution - MVP Method Note

## Purpose

This section describes how NOVA currently computes the Estimated output contribution values after an asset is connected to a selected substation.

The current implementation utalizes calculations performed on the backend and returned to the UI. It is suitable for screening and demonstration, not for investment-grade engineering decisions.

## Implementation Location

- Core calculation logic: api/src/services/energy-estimation.service.ts
- Estimation API endpoint: POST /api/ui/asset/estimate
- API controller wiring: api/src/controllers/ui.controller.ts and api/src/routes/ui.routes.ts
- UI consumer of backend result: frontend/src/components/grid-connect/GridConnectFooterPanel.tsx
- Frontend fallback utility (used only if API call fails): frontend/src/utils/energyEstimation.ts

## Inputs Used

1. Selected asset variant (wind or solar metadata and specification text)
2. Marker location (latitude, longitude)
3. Selected substation (name, id, connection distance)
4. Solar potential at location (pv_annual_kwh_kwp from pvout.geojson), when available
5. Wind speed at location (seasonal fields from windspeed.geojson), when available

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

## Calculation Logic

### Data source precedence

- Solar capacity factor source order:
  1. Location lookup from pvout.geojson (pv_annual_kwh_kwp)
  2. Fallback to latitude-adjusted default solar capacity factor
- Wind capacity factor source order:
  1. Location lookup from windspeed.geojson (seasonal windspeed fields)
  2. Fallback to latitude-adjusted default wind capacity factor

### 1) Determine technology and capacity

- Technology is inferred from selected variant metadata (keywords in name/spec text/icon paths).
- Installed capacity is parsed from specification fields such as Capacity, Rated Power, or Wattage.
- If solar values look module-level only (for example 500 Wp), fallback capacity is used:
  - Farm = 5 MW
  - Roof = 0.35 MW

### 2) Compute resource-adjusted capacity factor

- Solar uses location-specific pvout first, when available:

CF_solar = clamp(pv_annual_kwh_kwp / 8760, 0.08, 0.25)

- If pvout is not available, solar falls back to latitude-adjusted default capacity factor.

- Wind uses location-specific windspeed first, when available:
  - Annualized windspeed is derived from seasonal values:

v_wind = mean(ws_spring1, ws_summer1, ws_autumn1, ws_winter1)

  - If all seasonal values are not available, ws_spring1 is used as fallback.
  - Capacity factor is then estimated with a bounded planning curve:

CF_wind = clamp(0.02 + 0.0065 x v_wind^2, 0.15, 0.60)

- If windspeed is not available, wind falls back to latitude-adjusted default capacity factor.
- Unknown technology uses bounded default behavior.

### 3) Compute annual delivered energy

Gross annual energy:

E_gross = P_installed x 8760 x CF

Availability adjustment:

E_available = E_gross x 0.97

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

- Values are rounded for display.

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
- A scenario-scale installed capacity and solar capacity factor are used.
- Availability, losses, and short-distance penalties are applied.
- MWh/year is converted to MW and then normalized against assumed headroom and local demand to get percentages.

## Known Limitations

1. No hourly weather time series or plant-specific performance model
2. No explicit network power-flow or operational constraints
3. No measured substation headroom/load profile in this MVP
4. Some asset specs are text-only and parsed heuristically
5. Solar uses annual specific yield (pvout), not sub-hourly irradiance and temperature dynamics
6. Wind uses seasonal-average speed and a simplified CF curve, not turbine-specific power curves or hub-height correction

