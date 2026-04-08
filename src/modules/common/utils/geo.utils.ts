/**
 * Approximate distance in km between two lat/lng points.
 * Uses equirectangular approximation (accurate enough for <100km).
 */
export function approxDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const avgLat = (((lat1 + lat2) / 2) * Math.PI) / 180;
  const x = dLng * Math.cos(avgLat);
  const y = dLat;
  return R * Math.sqrt(x * x + y * y);
}

/**
 * Check if coordinates are within Costa Rica bounding box.
 */
export function isWithinCostaRica(lat: number, lng: number): boolean {
  return lat >= 8.0 && lat <= 11.2 && lng >= -86.0 && lng <= -82.5;
}
