import { useMemo, useState } from 'react';
import {
  buildLocationText,
  estimateRescueZone,
  findNearestMapPoint,
  formatDistance,
  getCurrentPosition,
} from '../lib/geo';
import type { Coordinates, MapPoint, RescueZone } from '../types';

export function PublicInterface({
  mapPoints,
  rescueZones,
  userLocation,
  onLocationFound,
}: {
  mapPoints: MapPoint[];
  rescueZones: RescueZone[];
  userLocation: Coordinates | null;
  onLocationFound: (location: Coordinates) => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [towDetails, setTowDetails] = useState({
    boat: '',
    issue: '',
    people: '',
  });

  const nearest = useMemo(
    () => (userLocation ? findNearestMapPoint(userLocation, mapPoints) : undefined),
    [mapPoints, userLocation],
  );
  const zone = userLocation
    ? estimateRescueZone(userLocation, mapPoints, rescueZones)
    : 'Waiting for GPS';
  const locationText = userLocation ? buildLocationText(userLocation, zone, nearest) : '';
  const publicMapLink =
    userLocation && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?lat=${userLocation.latitude.toFixed(
          6,
        )}&lng=${userLocation.longitude.toFixed(6)}`
      : '';

  const findLocation = async () => {
    setStatus('Requesting phone GPS...');
    try {
      const location = await getCurrentPosition();
      onLocationFound(location);
      setStatus('GPS location found.');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const shareLocation = async () => {
    if (!locationText) {
      setStatus('Find GPS location first.');
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: 'Mosquito Lake location',
        text: publicMapLink ? `${locationText}\nMap: ${publicMapLink}` : locationText,
        url: publicMapLink || undefined,
      });
      return;
    }

    await navigator.clipboard.writeText(
      publicMapLink ? `${locationText}\nMap: ${publicMapLink}` : locationText,
    );
    setStatus('Location text copied.');
  };

  const towMessage = [
    'Non-emergency Mosquito Lake help request',
    towDetails.boat && `Boat: ${towDetails.boat}`,
    towDetails.issue && `Issue: ${towDetails.issue}`,
    towDetails.people && `People aboard: ${towDetails.people}`,
    locationText,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="panel-stack">
      <section className="action-card urgent">
        <h2>Emergency Help</h2>
        <p>For danger, injury, missing persons, fire, sinking, or distress, call 911 now.</p>
        <a className="primary-action danger" href="tel:911">
          Call 911
        </a>
      </section>

      <section className="action-card">
        <h2>Share My Lake Location</h2>
        <button className="primary-action" type="button" onClick={findLocation}>
          Find my GPS location
        </button>

        {userLocation && (
          <div className="result-box">
            <p>
              <strong>GPS:</strong> {userLocation.latitude.toFixed(6)},{' '}
              {userLocation.longitude.toFixed(6)}
            </p>
            <p>
              <strong>Estimated rescue zone:</strong> {zone}
            </p>
            {nearest && (
              <p>
                <strong>Nearest visible point:</strong> {nearest.point.name},{' '}
                {formatDistance(nearest.distanceMeters)} away
              </p>
            )}
          </div>
        )}

        <button className="secondary-action" type="button" onClick={shareLocation}>
          Share GPS/location text
        </button>
        {publicMapLink && (
          <div className="result-box">
            <p>
              <strong>Shareable public map link:</strong>
            </p>
            <p>{publicMapLink}</p>
          </div>
        )}
        {status && <p className="status-text">{status}</p>}
      </section>

      <section className="action-card">
        <h2>Non-Emergency Tow / Help</h2>
        <label>
          Boat description
          <input
            value={towDetails.boat}
            onChange={(event) => setTowDetails({ ...towDetails, boat: event.target.value })}
            placeholder="Example: white 18 ft bowrider"
          />
        </label>
        <label>
          Problem
          <textarea
            value={towDetails.issue}
            onChange={(event) => setTowDetails({ ...towDetails, issue: event.target.value })}
            placeholder="Example: disabled motor, anchored safely"
          />
        </label>
        <label>
          People aboard
          <input
            value={towDetails.people}
            onChange={(event) => setTowDetails({ ...towDetails, people: event.target.value })}
            inputMode="numeric"
          />
        </label>
        <textarea className="message-preview" readOnly value={towMessage} />
        <button
          className="secondary-action"
          type="button"
          onClick={() => navigator.clipboard.writeText(towMessage)}
        >
          Copy help message
        </button>
      </section>
    </div>
  );
}
