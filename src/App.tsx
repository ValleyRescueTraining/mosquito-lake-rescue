import { useEffect, useMemo, useState } from 'react';
import { AdminInterface } from './components/AdminInterface';
import { PublicInterface } from './components/PublicInterface';
import { ResponderInterface } from './components/ResponderInterface';
import { RescueMap } from './components/RescueMap';
import { isSupabaseConfigured } from './lib/supabase';
import { loadMapPoints } from './services/mapPoints';
import type { Coordinates, IncidentMarker, InterfaceMode, MapPoint } from './types';

const modes: Array<{ id: InterfaceMode; label: string }> = [
  { id: 'public', label: 'Public' },
  { id: 'responder', label: 'Responder' },
  { id: 'admin', label: 'Admin' },
];

export const App = () => {
  const [mode, setMode] = useState<InterfaceMode>('public');
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [incidentMarkers, setIncidentMarkers] = useState<IncidentMarker[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [pendingDrop, setPendingDrop] = useState<Coordinates | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const latitude = Number(params.get('lat'));
    const longitude = Number(params.get('lng'));

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      setUserLocation({ latitude, longitude });
    }
  }, []);

  useEffect(() => {
    loadMapPoints(mode === 'public')
      .then(setMapPoints)
      .catch((error: Error) => setMapError(error.message));
  }, [mode]);

  const visibleMapPoints = useMemo(
    () => (mode === 'public' ? mapPoints.filter((point) => point.public_visible) : mapPoints),
    [mapPoints, mode],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Mosquito Lake</p>
          <h1>Rescue Assistant</h1>
        </div>
        <a className="call-link" href="tel:911">
          Call 911
        </a>
      </header>

      {!isSupabaseConfigured && (
        <div className="notice">
          Supabase is not configured yet. Add values to <strong>.env</strong> from
          <strong> .env.example</strong> to load live lake data.
        </div>
      )}

      <nav className="mode-tabs" aria-label="Interface selector">
        {modes.map((item) => (
          <button
            key={item.id}
            className={mode === item.id ? 'active' : ''}
            type="button"
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="main-layout">
        <section className="map-panel" aria-label="Mosquito Lake map">
          <RescueMap
            mapPoints={visibleMapPoints}
            incidentMarkers={incidentMarkers}
            userLocation={userLocation}
            pendingDrop={pendingDrop}
            allowDrop={mode === 'responder'}
            onDropMarker={setPendingDrop}
          />
          {mapError && <p className="error-text">{mapError}</p>}
        </section>

        <section className="work-panel">
          {mode === 'public' && (
            <PublicInterface
              mapPoints={visibleMapPoints}
              userLocation={userLocation}
              onLocationFound={setUserLocation}
            />
          )}
          {mode === 'responder' && (
            <ResponderInterface
              pendingDrop={pendingDrop}
              onPendingDropChange={setPendingDrop}
              onMarkersLoaded={setIncidentMarkers}
              onMarkerSaved={(marker) =>
                setIncidentMarkers((current) => [marker, ...current])
              }
            />
          )}
          {mode === 'admin' && (
            <AdminInterface mapPoints={mapPoints} onMapPointsChange={setMapPoints} />
          )}
        </section>
      </main>
    </div>
  );
};
