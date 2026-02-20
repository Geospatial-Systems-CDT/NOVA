# NOVA Data science

NOVA data science component uses different ML algorithms to search and find the most optimal location for an asset (wind turbine for this phase) within a polygon on a map. The focus is on the features and functionality of the algorithms using the NOVA input geojson datasets and not on frontend aesthetics.

## Features

- Metaheuristic search and optimisation algorithms.
- Adding, editing and removing polygons.
- Adding and removing of wind turbines represented by Blue markers.
- Visualisation of optimal location represented by Green markers.
- Export of map polygon layers with contents as geojson.

## Prerequisites

- Python 3.11 or higher
- scikit-learn >= 1.7.0 or higher
- scipy >= .15

## Build Instructions

### Local Development Build

1. Install dependencies in a Python virtual environment:
   ```
     pip install -r requirements.txt
   ```

2. Build the TypeScript code:
   ```Python
   app.py
   ```
3. Click on the localhost link to open in a browser http://127.0.0.1:5000
   By default the app runs on port 5000

4. Further details are in the docs directory.

© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.  
Licensed under the Open Government Licence v3.0.  
