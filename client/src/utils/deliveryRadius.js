/**
 * Delivery Radius Utilities
 * Pure JS — distance calculation and address geocoding for QuickFit
 * Uses Haversine formula: accurate to within 0.5% for ground distances.
 */

// RS FASHIONS Store Coordinates & Delivery Zone (Devi Nagar, Vijayawada)
export const RS_FASHIONS_LOCATION = {
  name: 'RS FASHIONS',
  address: 'devi nagar, Vijayawada',
  lat: 16.5336383,
  lng: 80.6464595,
  deliveryRadiusKm: 10
};

// Comprehensive Vijayawada Localities & Pincodes Coordinates
export const VIJAYAWADA_AREA_COORDINATES = {
  // Key Vijayawada Areas (Within 10 km of RS FASHIONS)
  'devi nagar': { lat: 16.5336383, lng: 80.6464595, label: 'Devi Nagar' },
  'benz circle': { lat: 16.4984418, lng: 80.6526978, label: 'Benz Circle' },
  'mg road': { lat: 16.5074, lng: 80.6384, label: 'MG Road' },
  'bandar road': { lat: 16.5074, lng: 80.6384, label: 'Bandar Road' },
  'patamata': { lat: 16.4947, lng: 80.6582, label: 'Patamata' },
  'eluru road': { lat: 16.5220, lng: 80.6350, label: 'Eluru Road' },
  'governorpet': { lat: 16.5168, lng: 80.6272, label: 'Governorpet' },
  'labbipet': { lat: 16.5050, lng: 80.6430, label: 'Labbipet' },
  'kunchanapalli': { lat: 16.4673, lng: 80.6068, label: 'Kunchanapalli' },
  'moghalrajpuram': { lat: 16.5090, lng: 80.6520, label: 'Moghalrajpuram' },
  'auto nagar': { lat: 16.4950, lng: 80.6720, label: 'Auto Nagar' },
  'bhavanipuram': { lat: 16.5250, lng: 80.5980, label: 'Bhavanipuram' },
  'gunadala': { lat: 16.5186, lng: 80.6698, label: 'Gunadala' },
  'gollapudi': { lat: 16.5500, lng: 80.5750, label: 'Gollapudi' },
  'krishna lanka': { lat: 16.5015, lng: 80.6285, label: 'Krishna Lanka' },
  'satyanarayanapuram': { lat: 16.5260, lng: 80.6320, label: 'Satyanarayanapuram' },
  'one town': { lat: 16.5180, lng: 80.6120, label: 'One Town' },
  'two town': { lat: 16.5190, lng: 80.6200, label: 'Two Town' },
  'kanuru': { lat: 16.4850, lng: 80.6850, label: 'Kanuru' },
  'poranki': { lat: 16.4750, lng: 80.7050, label: 'Poranki' },
  'tadigadapa': { lat: 16.4700, lng: 80.7000, label: 'Tadigadapa' },
  'tadepalli': { lat: 16.4800, lng: 80.6050, label: 'Tadepalli' },
  'vidyadharapuram': { lat: 16.5300, lng: 80.5900, label: 'Vidyadharapuram' },
  'payakapuram': { lat: 16.5520, lng: 80.6450, label: 'Payakapuram' },
  'kandrika': { lat: 16.5580, lng: 80.6550, label: 'Kandrika' },
  'enikepadu': { lat: 16.5210, lng: 80.7050, label: 'Enikepadu' },
  'ramavarappadu': { lat: 16.5230, lng: 80.6820, label: 'Ramavarappadu' },
  'prasadampadu': { lat: 16.5220, lng: 80.6930, label: 'Prasadampadu' },
  'singh nagar': { lat: 16.5450, lng: 80.6380, label: 'Singh Nagar' },
  'madhuranagar': { lat: 16.5200, lng: 80.6400, label: 'Madhuranagar' },

  // Out of Zone Localities (Greater than 10 km from RS FASHIONS)
  'penamaluru': { lat: 16.4650, lng: 80.7200, label: 'Penamaluru' },
  'kankipadu': { lat: 16.4250, lng: 80.7750, label: 'Kankipadu' },
  'gannavaram': { lat: 16.5414, lng: 80.7963, label: 'Gannavaram' },
  'airport': { lat: 16.5414, lng: 80.7963, label: 'Vijayawada Airport' },
  'kesarapalli': { lat: 16.5350, lng: 80.7600, label: 'Kesarapalli' },
  'mangalagiri': { lat: 16.4300, lng: 80.5650, label: 'Mangalagiri' },
  'guntur': { lat: 16.3067, lng: 80.4365, label: 'Guntur' },
  'tenali': { lat: 16.2430, lng: 80.6400, label: 'Tenali' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, label: 'Hyderabad' },

  // Vijayawada Pincodes Lookup
  '520001': { lat: 16.5180, lng: 80.6120, label: 'Vijayawada 520001' },
  '520002': { lat: 16.5168, lng: 80.6272, label: 'Governorpet 520002' },
  '520003': { lat: 16.5336383, lng: 80.6464595, label: 'Devi Nagar 520003' },
  '520004': { lat: 16.5186, lng: 80.6698, label: 'Gunadala 520004' },
  '520005': { lat: 16.4250, lng: 80.7750, label: 'Kankipadu 520005' },
  '520007': { lat: 16.4950, lng: 80.6720, label: 'Auto Nagar 520007' },
  '520008': { lat: 16.4947, lng: 80.6582, label: 'Patamata 520008' },
  '520010': { lat: 16.4984418, lng: 80.6526978, label: 'Benz Circle 520010' },
  '520011': { lat: 16.5260, lng: 80.6320, label: 'Satyanarayanapuram 520011' },
  '520012': { lat: 16.5250, lng: 80.5980, label: 'Bhavanipuram 520012' },
  '520013': { lat: 16.5015, lng: 80.6285, label: 'Krishna Lanka 520013' },
  '520015': { lat: 16.5300, lng: 80.5900, label: 'Vidyadharapuram 520015' },
  '521101': { lat: 16.5414, lng: 80.7963, label: 'Gannavaram 521101' },
  '521108': { lat: 16.5350, lng: 80.7600, label: 'Kesarapalli 521108' }
};

/**
 * Calculates the great-circle distance between two GPS coordinates (in km).
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
 * Fetches all active stores from the backend.
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
 * Finds the nearest active store within its delivery radius.
 */
export function findNearestStore(customerLat, customerLng, stores) {
  if (!stores || stores.length === 0) return null;
  let nearest = null;
  let minDistance = Infinity;
  for (const store of stores) {
    if (!store.location?.lat || !store.location?.lng) continue;
    const dist = haversineDistance(customerLat, customerLng, store.location.lat, store.location.lng);
    if (dist < minDistance) { minDistance = dist; nearest = { store, distanceKm: dist }; }
  }
  if (!nearest) return null;
  return nearest.distanceKm <= nearest.store.deliveryRadiusKm ? nearest : null;
}

/**
 * Finds ALL active stores within their respective delivery radii of the customer.
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
        distanceKm: parseFloat(dist.toFixed(2)),
        estimatedMinutes: estimateDeliveryMinutes(dist)
      });
    }
  }
  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results;
}

/**
 * Resolves the customer's delivery destination coordinates from their Delivery Address / selected map location.
 * Does NOT use the customer's device/physical GPS location.
 */
export async function resolveDeliveryCoordinates(addressData = {}) {
  const { address = '', area = '', landmark = '', pincode = '', selectedCoords = null } = addressData;

  // 1. If explicit map coordinates were passed or selected
  if (selectedCoords && typeof selectedCoords.lat === 'number' && typeof selectedCoords.lng === 'number') {
    return {
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      source: 'selected_coordinates'
    };
  }

  // 2. Check if the address contains an embedded Google Maps URL or latitude,longitude string
  const fullText = `${address} ${landmark} ${area} ${pincode}`.trim();
  const mapsMatch = fullText.match(/([-+]?\d{1,2}\.\d{3,8})[,\s]+([-+]?\d{1,3}\.\d{3,8})/);
  if (mapsMatch) {
    const lat = parseFloat(mapsMatch[1]);
    const lng = parseFloat(mapsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, source: 'parsed_address_coordinates' };
    }
  }

  // 3. Match against Pincode if provided (exact 6-digit postal zone)
  const cleanPin = String(pincode || '').replace(/\D/g, '');
  if (cleanPin && VIJAYAWADA_AREA_COORDINATES[cleanPin]) {
    return {
      ...VIJAYAWADA_AREA_COORDINATES[cleanPin],
      source: 'pincode_dictionary'
    };
  }

  // 4. Match against specific locality names embedded inside Landmark or Street Address
  const lowerAddressText = `${address} ${landmark}`.toLowerCase();
  for (const [key, coords] of Object.entries(VIJAYAWADA_AREA_COORDINATES)) {
    // Only check key names with >= 4 chars to avoid false partial matches
    if (key.length >= 4 && isNaN(Number(key)) && lowerAddressText.includes(key)) {
      return {
        ...coords,
        source: 'text_matched_dictionary'
      };
    }
  }

  // 5. Normalized dictionary lookup for Area / Locality dropdown
  const normArea = (area || '').toLowerCase().trim();
  if (normArea && VIJAYAWADA_AREA_COORDINATES[normArea]) {
    return {
      ...VIJAYAWADA_AREA_COORDINATES[normArea],
      source: 'area_dictionary'
    };
  }

  // 6. Optional geocoding via OpenStreetMap Nominatim with strict 2-second timeout
  try {
    const searchQuery = [address, landmark, area, pincode, 'Vijayawada', 'Andhra Pradesh']
      .filter(Boolean)
      .join(', ');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`,
      {
        headers: { 'User-Agent': 'QuickFit-Delivery/1.0' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (geoRes.ok) {
      const data = await geoRes.json();
      if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng, source: 'nominatim_geocoding' };
        }
      }
    }
  } catch (geoErr) {
    // Graceful fallback to default Benz Circle coordinates if Nominatim is offline/slow
  }

  // 7. Default central Vijayawada coordinates (Benz Circle)
  return {
    ...VIJAYAWADA_AREA_COORDINATES['benz circle'],
    source: 'vijayawada_central_default'
  };
}

/**
 * Verifies Delivery Address against the 10 km delivery zone of RS FASHIONS.
 * 
 * Rules:
 * - Within 10 km: "⚡ Delivery available from RS FASHIONS" (allows order)
 * - Outside 10 km: "Sorry, we are currently not available at this location." (blocks order)
 * - Does NOT use the customer's physical/device GPS location.
 */
export async function verifyDeliveryAddress(addressData = {}, API_BASE_URL = '') {
  // 1. Resolve coordinates of the entered Delivery Address
  const coords = await resolveDeliveryCoordinates(addressData);
  const deliveryLat = coords.lat;
  const deliveryLng = coords.lng;

  // 2. Fetch active stores to locate RS FASHIONS (with fallback to default)
  let rsStore = null;
  if (API_BASE_URL) {
    try {
      const stores = await fetchActiveStores(API_BASE_URL);
      rsStore = stores.find((s) => s.name?.toUpperCase().includes('RS FASHION')) || null;
    } catch {
      // Use fallback store
    }
  }

  if (!rsStore || !rsStore.location?.lat) {
    rsStore = {
      _id: '6a8165f4b2980c896c692183',
      name: RS_FASHIONS_LOCATION.name,
      address: RS_FASHIONS_LOCATION.address,
      location: { lat: RS_FASHIONS_LOCATION.lat, lng: RS_FASHIONS_LOCATION.lng },
      deliveryRadiusKm: RS_FASHIONS_LOCATION.deliveryRadiusKm,
      status: 'Active'
    };
  }

  const storeLat = rsStore.location.lat;
  const storeLng = rsStore.location.lng;
  const maxRadiusKm = rsStore.deliveryRadiusKm || 10;

  // 3. Compute distance between Delivery Address and RS FASHIONS
  const distanceKm = haversineDistance(deliveryLat, deliveryLng, storeLat, storeLng);
  const roundedDist = parseFloat(distanceKm.toFixed(2));

  // 4. Validate 10 km zone threshold
  const inZone = distanceKm <= maxRadiusKm;

  if (inZone) {
    return {
      inZone: true,
      store: rsStore,
      nearestStore: rsStore,
      distanceKm: roundedDist,
      lat: deliveryLat,
      lng: deliveryLng,
      message: '⚡ Delivery available from RS FASHIONS'
    };
  }

  return {
    inZone: false,
    store: rsStore,
    nearestStore: null,
    closestStore: rsStore,
    distanceKm: roundedDist,
    lat: deliveryLat,
    lng: deliveryLng,
    message: 'Sorry, we are currently not available at this location.'
  };
}

/**
 * Checks all active stores for coordinates and returns availability.
 * Specifically checks against RS FASHIONS 10 km zone.
 */
export async function checkDeliveryAvailability(customerLat, customerLng, API_BASE_URL) {
  let stores = [];
  if (API_BASE_URL) {
    stores = await fetchActiveStores(API_BASE_URL);
  }

  const rsStore = stores.find((s) => s.name?.toUpperCase().includes('RS FASHION')) || {
    _id: '6a8165f4b2980c896c692183',
    name: RS_FASHIONS_LOCATION.name,
    address: RS_FASHIONS_LOCATION.address,
    location: { lat: RS_FASHIONS_LOCATION.lat, lng: RS_FASHIONS_LOCATION.lng },
    deliveryRadiusKm: RS_FASHIONS_LOCATION.deliveryRadiusKm
  };

  const storeLat = rsStore.location.lat;
  const storeLng = rsStore.location.lng;
  const maxRadiusKm = rsStore.deliveryRadiusKm || 10;

  const distanceKm = haversineDistance(customerLat, customerLng, storeLat, storeLng);
  const roundedDist = parseFloat(distanceKm.toFixed(2));

  if (distanceKm <= maxRadiusKm) {
    return {
      inZone: true,
      nearestStore: rsStore,
      store: rsStore,
      distanceKm: roundedDist,
      allStores: stores,
      message: '⚡ Delivery available from RS FASHIONS'
    };
  }

  return {
    inZone: false,
    nearestStore: null,
    closestStore: rsStore,
    distanceKm: roundedDist,
    allStores: stores,
    message: 'Sorry, we are currently not available at this location.'
  };
}
