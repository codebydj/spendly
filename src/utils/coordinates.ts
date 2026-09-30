/**
 * Coordinate Validation Utility for Maps & Geolocation
 * Ensures Leaflet never receives NaN, null, undefined, or out-of-range coordinates.
 */
export function hasValidCoordinates(
  latitude: unknown,
  longitude: unknown
): latitude is number {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Safely parse potential coordinate inputs from string or number
 */
export function parseCoordinates(
  latInput: unknown,
  lngInput: unknown
): { latitude: number; longitude: number } | null {
  const lat = typeof latInput === 'string' ? parseFloat(latInput) : (latInput as number);
  const lng = typeof lngInput === 'string' ? parseFloat(lngInput) : (lngInput as number);

  if (hasValidCoordinates(lat, lng)) {
    return { latitude: lat, longitude: lng };
  }
  return null;
}
