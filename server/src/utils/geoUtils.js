/**
 * Server-side Geo Utilities
 * Mirrors client-side deliveryRadius.js — keeps backend self-contained.
 */

/**
 * Calculates the great-circle distance between two GPS coordinates (km).
 * Uses the Haversine formula — accurate to within 0.5% for ground distances.
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimates delivery time in minutes.
 * Formula: 8 min prep + 8 min/km travel (~7.5 km/h city speed).
 */
export function estimateDeliveryMinutes(distanceKm) {
  return Math.round(distanceKm * 8 + 8);
}

/**
 * Finds ALL active stores within their delivery radii of the customer.
 * Returns them sorted by distance ascending (nearest first).
 */
export function findAllNearbyStores(customerLat, customerLng, stores) {
  if (!stores || stores.length === 0) return [];
  const results = [];
  for (const store of stores) {
    if (!store.location?.lat || !store.location?.lng) continue;
    const dist = haversineDistance(customerLat, customerLng, store.location.lat, store.location.lng);
    if (dist <= store.deliveryRadiusKm) {
      results.push({
        store,
        distanceKm: dist,
        estimatedMinutes: estimateDeliveryMinutes(dist)
      });
    }
  }
  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results;
}

/**
 * Finds the absolute nearest store (even if outside delivery radius).
 */
export function findClosestStore(customerLat, customerLng, stores) {
  if (!stores || stores.length === 0) return null;
  let closest = null;
  let minDist = Infinity;
  for (const store of stores) {
    if (!store.location?.lat || !store.location?.lng) continue;
    const dist = haversineDistance(customerLat, customerLng, store.location.lat, store.location.lng);
    if (dist < minDist) { minDist = dist; closest = { store, distanceKm: dist }; }
  }
  return closest;
}
