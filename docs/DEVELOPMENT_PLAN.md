# Development Plan

## Repository Analysis

The repository started as a fresh GitHub repository with only:

- `README.md`
- `LICENSE`

No application framework, package manifest, source directory, build tooling, or
deployment configuration existed before Phase 1 began.

## Framework Choice

Phase 1 uses:

- Vite for a small, fast web app build.
- React with TypeScript for maintainable public, responder, and admin screens.
- Leaflet and React Leaflet for a real interactive map.
- Supabase JS for database access.

This stack is lightweight enough for phones on boats and flexible enough for
future live tracking, PWA deployment, photo attachments, and search-area drawing.

## Phase 1

- Create clean project structure.
- Add TypeScript, Vite, React, Leaflet, and Supabase client setup.
- Load `map_points` from Supabase.
- Filter public map points by `public_visible`.
- Build public interface:
  - Call 911 button.
  - Find GPS location.
  - Estimate rescue zone from nearby map point zones.
  - Show nearest public map point.
  - Share GPS/location text.
  - Build non-emergency tow/help message.
- Build responder interface:
  - Login-ready layout.
  - Create/select incident.
  - Store TC911 run number as `tc911_run_number`.
  - Capture water rescue incident type.
  - Capture incident command notes.
  - Support multiple incidents.
  - Use statuses: `Active`, `Standby`, `Closed`.
  - Tap/drop marker workflow.
  - Save markers to `incident_markers`.
  - Show incident markers on map.
  - Close incidents with closeout notes.
  - Review and search archived incident history.
  - Generate shareable public map links.
- Build admin interface:
  - Add map points.
  - Categorize hazards, launches, islands, landmarks, docks, access points, and responder assets.
  - Toggle `public_visible` and `visible_from_water`.

## Phase 2

- Add Supabase Auth roles for public, responder, dispatcher, and admin access.
- Confirm final incident table schema and Row Level Security policies.
- Add agency-approved incident status transition rules for `Active`, `Standby`, and
  `Closed`.
- Add editable incident details and archived incident review filters.
- Add marker editing and deletion with audit metadata.
- Add better zone logic if official lake zones are provided as polygons.

## Phase 3

- Live responder and boat tracking.
- Add marker from current GPS.
- Photo attachments on incident markers.
- Search area drawing and assignment polygons.
- Offline-aware PWA installation and field caching.
- Deployment under Valley Rescue Training domain.
