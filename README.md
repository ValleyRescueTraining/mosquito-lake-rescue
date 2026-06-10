# Mosquito Lake Rescue Assistant

Mobile-first public safety web app for Mosquito Lake water rescue operations
involving TCWRT, Bazetta Fire, Mecca Fire, and Trumbull County 911.

## Current Phase

Phase 1 is a TypeScript React app built with Vite, Supabase, and Leaflet.

Implemented foundation:

- Public interface with 911 call action, GPS lookup, estimated rescue zone,
  nearest public map point, shareable location text, and non-emergency help
  message builder.
- Responder interface scaffold with incident selection/creation, TC911 run
  number field, water rescue incident type, incident command notes, map tap/drop
  marker workflow, notes, closeout notes, searchable archive support, and
  shareable public map links.
- Admin interface scaffold for adding map points and managing visibility flags.
- Real interactive Leaflet map using OpenStreetMap tiles.
- Supabase client setup for `map_points`, `incidents`, and `incident_markers`.
- PWA manifest and service worker foundation for installable/offline support.

## Local Setup

1. Install Node.js 20 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

4. Add your Supabase URL and anon key to `.env`.
5. Start the app:

   ```bash
   npm run dev
   ```

## Supabase Tables

The app expects:

- `map_points`, already populated with Mosquito Lake KML-derived points.
- `incident_markers`, already available for responder markers.
- `incidents`, for multiple simultaneous incidents and archived history.

Trumbull County 911 assigns official run numbers. This app stores them as
`tc911_run_number` and does not generate official run numbers.

See `supabase/schema.sql` for the Phase 1 incident schema and future-ready
tables for responder tracking and search areas.

Phase 1 incident statuses are `Active`, `Standby`, and `Closed`.

Water rescue incident types are:

- Missing swimmer
- Missing boater
- Capsized vessel
- Medical emergency
- Recovery operation
- Search only

## Deployment Targets

The app is structured for a future installable/PWA deployment at either:

- `valleyrescuetraining.com/lake`
- `lake.valleyrescuetraining.com`
