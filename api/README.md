# NOVA API

NOVA API is a RESTful service that provides geospatial data processing and visualization capabilities. It handles user authentication, geographic data processing, and layer management for mapping applications.

## Features

- Geographic data processing with GeoJSON
- Layer management for different asset types
- Location search functionality
- Health check endpoint for monitoring
- Swagger API documentation

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Docker (optional, for containerized deployment)

## Build Instructions

### Local Development Build

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript code:
   ```bash
   npm run build
   ```

### Docker Build

To build the application as a Docker container:

```bash
cd docker
./build.sh
```

This will create a Docker image named `api`.

## Run Instructions

### Local Development

1. Start the development server with hot-reloading:
   ```bash
   npm run dev
   ```

2. Or run the built application:
   ```bash
   npm start
   ```

By default, the server runs on port 3000. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

### Docker Run

To run the application in a Docker container:

```bash
docker run -p 3000:3000 api
```

To specify a different port:

```bash
docker run -p 8080:3000 -e PORT=3000 api
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api/docs
```

## Available Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/ui/search` - Search for locations
- `GET /api/ui/layers/:assetType` - Get layers by asset type
- `GET /api/ui/assets` - Get available assets
- `POST /api/ui/layer/:layerId` - Process GeoJSON data for a specific layer

## Testing

Run the test suite:

```bash
npm test
```

### Test Coverage

To run tests with coverage report:

```bash
npm run test:coverage
```

This will generate coverage reports in the `coverage` directory. To view the detailed HTML coverage report:

1. Open the file `coverage/lcov-report/index.html` in your web browser:
   ```bash
   # On Linux
   xdg-open coverage/lcov-report/index.html

   # On macOS
   open coverage/lcov-report/index.html

   # On Windows
   start coverage/lcov-report/index.html
   ```

2. The report shows:
   - **Statement Coverage**: Percentage of code statements executed
   - **Branch Coverage**: Percentage of code branches (if/else, switch cases) executed
   - **Function Coverage**: Percentage of functions called
   - **Line Coverage**: Percentage of executable lines executed

3. You can click on individual files to see detailed line-by-line coverage information, with:
   - Green: Covered lines
   - Red: Uncovered lines
   - Gray: Non-executable lines (comments, empty lines)

## Linting

Check code style:

```bash
npm run lint
```

Fix code style issues:

```bash
npm run lint:fix
```

© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.  
Licensed under the Open Government Licence v3.0.  
