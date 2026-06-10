import type { Coordinates, MapPoint } from '../types';

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const distanceInMeters = (from: Coordinates, to: Coordinates) => {
  const earthRadiusMeters = 6_371_000;
  const deltaLatitude = degreesToRadians(to.latitude - from.latitude);
  const deltaLongitude = degreesToRadians(to.longitude - from.longitude);
  const fromLatitude = degreesToRadians(from.latitude);
  const toLatitude = degreesToRadians(to.latitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (meters: number) => {
  if (meters < 1609.344) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1609.344).toFixed(2)} mi`;
};

export const findNearestMapPoint = (location: Coordinates, points: MapPoint[]) =>
  points
    .map((point) => ({
      point,
      distanceMeters: distanceInMeters(location, {
        latitude: point.latitude,
        longitude: point.longitude,
      }),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

export const estimateRescueZone = (location: Coordinates, points: MapPoint[]) => {
  const nearestWithZone = points
    .filter((point) => point.zone)
    .map((point) => ({
      zone: point.zone as string,
      distanceMeters: distanceInMeters(location, {
        latitude: point.latitude,
        longitude: point.longitude,
      }),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

  return nearestWithZone?.zone ?? 'Unknown zone';
};

export const getCurrentPosition = () =>
  new Promise<Coordinates>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS is not available on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => reject(new Error('Unable to get GPS location. Check location permissions.')),
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 10_000,
      },
    );
  });

export const buildLocationText = (
  location: Coordinates,
  zone: string,
  nearest?: { point: MapPoint; distanceMeters: number },
) => {
  const lines = [
    'Mosquito Lake location report',
    `GPS: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
    `Estimated rescue zone: ${zone}`,
  ];

  if (nearest) {
    lines.push(
      `Nearest point: ${nearest.point.name} (${formatDistance(nearest.distanceMeters)})`,
    );
  }

  if (location.accuracy) {
    lines.push(`GPS accuracy: about ${Math.round(location.accuracy)} m`);
  }

  return lines.join('\n');
};
