# **App Name**: Alpine Snow Watch

## Core Features:

- Data Ingestion Pipeline: Python script to fetch mock NDSI data, simulates cloud cover, and store time series data in Supabase.
- Supabase Integration: PostgreSQL database to store and manage station information and snow index data. Includes 'elevation' in the stations table and 'cloud_cover' in the stats table.
- Station Monitoring Dashboard: Display snow conditions of Zermatt Village, Theodul Glacier and Matterhorn Summit using interactive charts. Implemented using the Tremor library for React.
- Static Export Configuration: Configured Next.js to be able to export to static files so the app can be hosted on Github Pages.

## Style Guidelines:

- Primary color: #2E86AB - A deep sky blue evokes the cold environment being tracked in the app.
- Background color: #E0F2F7 - A very light desaturated sky blue serves as a neutral, non-distracting backdrop.
- Accent color: #A8D5BA - A light, vibrant, analogous green draws the eye to important actionable elements and data insights.
- Font: 'Inter', a sans-serif font for clean readability in both headlines and body text.
- Use weather-themed icons (snowflakes, clouds, sun) from a minimalist set to represent each weather variable and data point.
- Dashboard layout should use a grid system to organize station data and charts, focusing on a clear hierarchy for easy navigation and data discovery.
- Subtle transitions on data updates, station selection, and chart interactions to enhance user engagement without distracting from the data.