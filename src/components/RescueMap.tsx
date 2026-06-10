import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Coordinates, IncidentMarker, MapPoint, MapPointCategory } from '../types';

const lakeCenter: [number, number] = [41.307, -80.764];

const categoryColors: Record<MapPointCategory, string> = {
  hazard: '#c2410c',
  launch: '#047857',
  island: '#7c3aed',
  landmark: '#0369a1',
  dock: '#92400e',
  responder_asset: '#0f766e',
  access: '#15803d',
  zone: '#4f46e5',
  other: '#475569',
};

const markerTypeColors: Record<string, string> = {
  'Last Known Position': '#ef4444',
  'Point Last Seen': '#f97316',
  'Sonar Contact': '#8b5cf6',
  Hazard: '#b45309',
  'Victim Located': '#dc2626',
  'Evidence / Item Found': '#0f766e',
  'Diver Entry': '#2563eb',
  'Boat Staging': '#0891b2',
  'Command Post': '#111827',
  'Search Assignment': '#65a30d',
};

const makeIcon = (color: string, label: string, className = '') =>
  L.divIcon({
    className: `rescue-div-icon ${className}`,
    html: `<span style="background:${color}">${label}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });

function DropHandler({
  allowDrop,
  onDropMarker,
}: {
  allowDrop: boolean;
  onDropMarker: (coordinates: Coordinates) => void;
}) {
  useMapEvents({
    click(event) {
      if (!allowDrop) {
        return;
      }

      onDropMarker({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function FollowLocation({ location }: { location: Coordinates | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 14));
    }
  }, [location, map]);

  return null;
}

const describeMapPointCategory = (point: MapPoint) => {
  if (point.category === 'zone') {
    return 'Rescue zone';
  }

  if (point.category === 'access' || point.category === 'launch') {
    return 'Public rescue access point';
  }

  return point.category.replace('_', ' ');
};

export function RescueMap({
  mapPoints,
  incidentMarkers,
  userLocation,
  pendingDrop,
  allowDrop,
  onDropMarker,
}: {
  mapPoints: MapPoint[];
  incidentMarkers: IncidentMarker[];
  userLocation: Coordinates | null;
  pendingDrop: Coordinates | null;
  allowDrop: boolean;
  onDropMarker: (coordinates: Coordinates) => void;
}) {
  return (
    <MapContainer center={lakeCenter} zoom={13} scrollWheelZoom className="rescue-map">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DropHandler allowDrop={allowDrop} onDropMarker={onDropMarker} />
      <FollowLocation location={userLocation} />

      {mapPoints.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={makeIcon(categoryColors[point.category] ?? categoryColors.other, point.name[0])}
        >
          <Popup>
            <strong>{point.name}</strong>
            <br />
            {describeMapPointCategory(point)}
            {point.zone && (
              <>
                <br />
                Rescue zone {point.zone}
              </>
            )}
            {point.description && (
              <>
                <br />
                {point.description}
              </>
            )}
          </Popup>
        </Marker>
      ))}

      {incidentMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={makeIcon(markerTypeColors[marker.marker_type] ?? '#ef4444', '!', 'incident')}
        >
          <Popup>
            <strong>{marker.marker_type}</strong>
            {marker.notes && (
              <>
                <br />
                {marker.notes}
              </>
            )}
          </Popup>
        </Marker>
      ))}

      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={makeIcon('#0ea5e9', 'You', 'user-location')}
        >
          <Popup>Your current GPS location</Popup>
        </Marker>
      )}

      {pendingDrop && (
        <Marker
          position={[pendingDrop.latitude, pendingDrop.longitude]}
          icon={makeIcon('#facc15', '+', 'pending')}
        >
          <Popup>Pending responder marker</Popup>
        </Marker>
      )}

      <div className="map-legend" aria-label="Map legend">
        <span>
          <i style={{ background: categoryColors.zone }} /> Rescue zones
        </span>
        <span>
          <i style={{ background: categoryColors.access }} /> Public access
        </span>
        <span>
          <i style={{ background: categoryColors.hazard }} /> Hazards
        </span>
        <span>
          <i style={{ background: '#ef4444' }} /> Incident markers
        </span>
      </div>
    </MapContainer>
  );
}
