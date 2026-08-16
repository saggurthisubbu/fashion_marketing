/**
 * Delivery Radius Utilities
 * Pure JS — no API key needed for distance calculation.
 * Uses Haversine formula: accurate to within 0.5% for ground distances.
 */

/**
 * Calculates the great-circle distance between two GPS coordinates (in km).
 * @param {number} lat1 - Customer latitude
 * @param {number} lng1 - Customer longitude
 * @param {number} lat2 - Store latitude
 * @param {number} lng2 - Store longitude
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetches all active stores from the backend.
 * @param {string} API_BASE_URL
 * @returns {Promise<Array>} Array of active store objects
 */
export async function fetchActiveStores(API_BASE_URL) {
  try {
    const res = await fetch(`${API_BASE_URL}/stores`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[DeliveryRadius] Could not fetch stores:', err.message);
    return [];
  }
}

/**
 * Finds the nearest active store to the customer and checks if they're within its delivery radius.
 * @param {number} customerLat
 * @param {number} customerLng
 * @param {Array} stores - Active stores from backend
 * @returns {{ store: Object, distanceKm: number } | null} Nearest store within range, or null
 */
export function findNearestStore(customerLat, customerLng, stores) {
  if (!stores || stores.length === 0) return null;

  let nearest = null;
  let minDistance = Infinity;

  for (const store of stores) {
    if (!store.location?.lat || !store.location?.lng) continue;

    const dist = haversineDistance(
      customerLat,
      customerLng,
      store.location.lat,
      store.location.lng
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearest = { store, distanceKm: dist };
    }
  }

  if (!nearest) return null;

  // Only return if within the store's delivery radius
  if (nearest.distanceKm <= nearest.store.deliveryRadiusKm) {
    return nearest;
  }

  return null;
}

/**
 * Checks all active stores and returns the nearest in-range store.
 * Returns an object with: inZone (bool), nearestStore, distanceKm, allStores.
 * @param {number} customerLat
 * @param {number} customerLng
 * @param {string} API_BASE_URL
 */
export async function checkDeliveryAvailability(customerLat, customerLng, API_BASE_URL) {
  const stores = await fetchActiveStores(API_BASE_URL);

  if (stores.length === 0) {
    return {
      inZone: false,
      nearestStore: null,
      distanceKm: null,
      allStores: [],
      message: 'No active stores found. Please contact support.'
    };
  }

  const result = findNearestStore(customerLat, customerLng, stores);

  if (result) {
    return {
      inZone: true,
      nearestStore: result.store,
      distanceKm: result.distanceKm,
      allStores: stores,
      message: `Delivery available from ${result.store.name} (~${result.distanceKm.toFixed(1)} km away)`
    };
  }

  // Find closest store (even if outside radius) for the error message
  let closestStore = null;
  let closestDist = Infinity;
  for (const store of stores) {
    if (!store.location?.lat || !store.location?.lng) continue;
    const dist = haversineDistance(customerLat, customerLng, store.location.lat, store.location.lng);
    if (dist < closestDist) {
      closestDist = dist;
      closestStore = store;
    }
  }

  return {
    inZone: false,
    nearestStore: null,
    distanceKm: closestDist < Infinity ? closestDist : null,
    closestStore,
    allStores: stores,
    message: 'Sorry, we are currently not available in your location.'
  };
}
