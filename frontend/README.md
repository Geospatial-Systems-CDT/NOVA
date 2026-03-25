# NOVA 3D Map Application

This is a React + Vite application featuring a full-screen 3D map powered by MapLibre GL JS.

## Features

- Full-screen 3D map visualization
- Interactive navigation controls
- 3D terrain and building extrusions
- Satellite imagery for realistic view
- Default view centered on the Isle of Wight, UK

## Setup

1. Clone the repository
2. Install dependencies:
    ```
    npm install
    ```
3. Create an `.env.local` file in the root of the frontend directory for your access tokens:
    ```
    VITE_MAPTILER_API_KEY=your_maptiler_access_token
    ```

Optional map startup overrides (UK centroid and initial zoom):

```
VITE_INITIAL_MAP_LONGITUDE=-1.611
VITE_INITIAL_MAP_LATITUDE=54.5
VITE_INITIAL_MAP_ZOOM=5.6
```

## Getting a Maptiler Access Token

To use this application, you need a Maptiler access token:

1. Sign up for a free account at [Maptiler](https://www.maptiler.com)
2. Navigate to your account page
3. Create find or create your access token
4. Copy the token value to your `.env.local` file

## Testing

Run the tests

```
npm test
```

Run the tests with coverage reporting

```
npm run test:coverage
```

## Development

Run the development server:

```
npm run dev
```

## Building for Production

Build the application:

```
npm run build
```

Preview the production build:

```
npm run preview
```

## Technologies Used

- React
- Vite
- MapLibre GL JS
- React Map GL

© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.  
Licensed under the Open Government Licence v3.0.  
