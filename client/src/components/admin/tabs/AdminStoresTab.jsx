import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  XCircle,
  Loader,
  X,
  Search,
  Radio,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ── Haversine helper (same formula as deliveryRadius.js) ──────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Google Maps helper (loaded dynamically, key optional) ────────────────────
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function loadGoogleMapsScript(onLoad) {
  if (window.google?.maps) { onLoad(); return; }
  if (!MAPS_API_KEY) return;
  const existing = document.getElementById('gm-script');
  if (existing) { existing.addEventListener('load', onLoad); return; }
  const script = document.createElement('script');
  script.id = 'gm-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=geometry`;
  script.async = true;
  script.defer = true;
  script.onload = onLoad;
  document.head.appendChild(script);
}

// ── Empty form default ───────────────────────────────────────────────────────
const emptyForm = {
  name: '',
  address: '',
  contactNumber: '',
  lat: '',
  lng: '',
  deliveryRadiusKm: 10,
  status: 'Active'
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAP MODAL — shows store pins + radius circles; supports click-to-pick location
// ═══════════════════════════════════════════════════════════════════════════════
const MapPickerModal = ({ stores, onPickLocation, onClose, currentLat, currentLng }) => {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const circlesRef = React.useRef([]);
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps);
  const [picked, setPicked] = useState(
    currentLat && currentLng ? { lat: Number(currentLat), lng: Number(currentLng) } : null
  );

  useEffect(() => {
    if (!MAPS_API_KEY) return;
    loadGoogleMapsScript(() => setMapsReady(true));
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;

    const center = currentLat && currentLng
      ? { lat: Number(currentLat), lng: Number(currentLng) }
      : { lat: 16.5062, lng: 80.6480 }; // Vijayawada default

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      mapTypeId: 'roadmap',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#a8a8b3' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252546' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] }
      ],
      disableDefaultUI: false
    });
    mapInstanceRef.current = map;

    // Draw existing stores
    stores.forEach((store) => {
      if (!store.location?.lat) return;
      const pos = { lat: store.location.lat, lng: store.location.lng };
      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        title: store.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: store.status === 'Active' ? '#22c55e' : '#71717a',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      });
      const info = new window.google.maps.InfoWindow({
        content: `<div style="font-family:system-ui;padding:8px;min-width:160px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${store.name}</div>
          <div style="font-size:11px;color:#666;">${store.address}</div>
          <div style="font-size:11px;color:#16a34a;margin-top:4px;">📍 ${store.deliveryRadiusKm} km radius · ${store.status}</div>
        </div>`
      });
      marker.addListener('click', () => info.open(map, marker));
      markersRef.current.push(marker);

      const circle = new window.google.maps.Circle({
        strokeColor: store.status === 'Active' ? '#22c55e' : '#71717a',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: store.status === 'Active' ? '#22c55e' : '#71717a',
        fillOpacity: 0.08,
        map,
        center: pos,
        radius: store.deliveryRadiusKm * 1000
      });
      circlesRef.current.push(circle);
    });

    // Show current pick
    if (picked) {
      new window.google.maps.Marker({
        position: picked,
        map,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        },
        title: 'Selected Location'
      });
    }

    // Click to pick
    map.addListener('click', (e) => {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPicked(newPos);
    });
  }, [mapsReady]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-white font-black text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Store Location Picker
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5">Click on the map to select store location</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[400px]">
          {!MAPS_API_KEY ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <MapPin className="w-12 h-12 text-zinc-600" />
              <p className="text-sm font-bold">Google Maps API key not configured</p>
              <p className="text-xs text-zinc-500">Add VITE_GOOGLE_MAPS_API_KEY to client/.env to enable map</p>
              <p className="text-xs text-zinc-500">Use manual lat/lng input in the form instead</p>
            </div>
          ) : !mapsReady ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
          ) : (
            <div ref={mapRef} className="absolute inset-0" />
          )}
        </div>

        {/* Footer */}
        {picked && (
          <div className="px-5 py-4 border-t border-zinc-800 flex items-center justify-between gap-4">
            <div className="text-xs text-zinc-300">
              <span className="text-zinc-500 mr-1">Selected:</span>
              <span className="font-mono text-emerald-400">
                {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
              </span>
            </div>
            <button
              onClick={() => { onPickLocation(picked.lat, picked.lng); onClose(); }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors cursor-pointer"
            >
              Use This Location ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export const AdminStoresTab = ({
  storesList = [],
  onAddStore,
  onEditStore,
  onDeleteStore
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const activeStores = storesList.filter(s => s.status === 'Active').length;

  const filteredStores = storesList.filter(s => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return s.name?.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditingStore(null);
    setForm(emptyForm);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEdit = (store) => {
    setEditingStore(store);
    setForm({
      name: store.name || '',
      address: store.address || '',
      contactNumber: store.contactNumber || '',
      lat: store.location?.lat?.toString() || '',
      lng: store.location?.lng?.toString() || '',
      deliveryRadiusKm: store.deliveryRadiusKm ?? 10,
      status: store.status || 'Active'
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRadiusChange = (e) => {
    setForm(prev => ({ ...prev, deliveryRadiusKm: Number(e.target.value) }));
  };

  const handleMapPick = (lat, lng) => {
    setForm(prev => ({ ...prev, lat: lat.toFixed(7), lng: lng.toFixed(7) }));
  };

  const handleDetectMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(7),
          lng: pos.coords.longitude.toFixed(7)
        }));
      },
      () => alert('Could not detect location. Please enter manually.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);

    if (!form.name.trim()) return setFormError('Store name is required.');
    if (!form.address.trim()) return setFormError('Store address is required.');
    if (!form.contactNumber.trim()) return setFormError('Contact number is required.');
    if (isNaN(lat) || isNaN(lng)) return setFormError('Valid latitude and longitude are required.');
    if (lat < -90 || lat > 90) return setFormError('Latitude must be between -90 and 90.');
    if (lng < -180 || lng > 180) return setFormError('Longitude must be between -180 and 180.');

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      contactNumber: form.contactNumber.trim(),
      location: { lat, lng },
      deliveryRadiusKm: Number(form.deliveryRadiusKm),
      status: form.status
    };

    setIsSaving(true);
    try {
      if (editingStore) {
        await onEditStore(editingStore._id, payload);
      } else {
        await onAddStore(payload);
      }
      setIsFormOpen(false);
      setEditingStore(null);
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || 'Failed to save store.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (store) => {
    if (!window.confirm(`Delete store "${store.name}"? This cannot be undone.`)) return;
    await onDeleteStore(store._id, store.name);
  };

  // ── Status badge ────────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      status === 'Active'
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        : 'bg-zinc-700/30 text-zinc-400 border-zinc-700'
    }`}>
      {status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {status}
    </span>
  );

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            Store Management
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            {storesList.length} store{storesList.length !== 1 ? 's' : ''} total ·{' '}
            <span className="text-emerald-400 font-bold">{activeStores} active</span>
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-100 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Store
        </button>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Stores</p>
          <p className="text-2xl font-black text-white mt-1">{storesList.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{activeStores}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Inactive</p>
          <p className="text-2xl font-black text-zinc-400 mt-1">{storesList.length - activeStores}</p>
        </div>
      </div>

      {/* ── Map overview for all stores ──────────────────────────────────────── */}
      {MAPS_API_KEY && storesList.length > 0 && (
        <button
          onClick={() => setIsMapOpen('overview')}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-bold transition-all cursor-pointer"
        >
          <MapPin className="w-4 h-4" />
          View All Stores on Map
        </button>
      )}

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      {storesList.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search stores by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
      )}

      {/* ── Store List ───────────────────────────────────────────────────────── */}
      {filteredStores.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Store className="w-12 h-12 text-zinc-700 mx-auto" />
          <p className="text-zinc-400 font-bold text-sm">
            {storesList.length === 0 ? 'No stores added yet' : 'No stores match your search'}
          </p>
          {storesList.length === 0 && (
            <p className="text-zinc-600 text-xs">Click "Add New Store" to set up your first delivery location</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStores.map((store) => {
            const isExpanded = expandedId === store._id;
            return (
              <div
                key={store._id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all"
              >
                {/* Row */}
                <div className="flex items-center gap-4 px-4 py-3.5">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    store.status === 'Active' ? 'bg-emerald-500/15' : 'bg-zinc-800'
                  }`}>
                    <Store className={`w-5 h-5 ${store.status === 'Active' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white text-sm">{store.name}</span>
                      <StatusBadge status={store.status} />
                    </div>
                    <p className="text-zinc-400 text-xs truncate mt-0.5">{store.address}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Radio className="w-3 h-3" />
                        {store.deliveryRadiusKm} km radius
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {store.contactNumber}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : store._id)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Expand details"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => openEdit(store)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Edit store"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(store)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete store"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      <div className="bg-zinc-950/60 rounded-xl p-3">
                        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-1">Coordinates</p>
                        <p className="text-zinc-300 text-[11px] font-mono">
                          {store.location?.lat?.toFixed(5)}, {store.location?.lng?.toFixed(5)}
                        </p>
                      </div>
                      <div className="bg-zinc-950/60 rounded-xl p-3">
                        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-1">Delivery Radius</p>
                        <p className="text-emerald-400 text-sm font-black">{store.deliveryRadiusKm} km</p>
                      </div>
                      <div className="bg-zinc-950/60 rounded-xl p-3 col-span-2 sm:col-span-1">
                        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-1">Contact</p>
                        <p className="text-zinc-300 text-[11px]">{store.contactNumber}</p>
                      </div>
                    </div>
                    {store.location?.lat && (
                      <a
                        href={`https://www.google.com/maps?q=${store.location.lat},${store.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        View on Google Maps
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ADD / EDIT STORE MODAL                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="text-white font-black text-base flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                {editingStore ? 'Edit Store' : 'Add New Store'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">

              {/* Error */}
              {formError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              {/* Store Name */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Store Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. QuickFit Central, Vijayawada"
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-xs"
                />
              </div>

              {/* Store Address */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Store Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="e.g. MG Road, Labbipet, Vijayawada, AP 520010"
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-xs resize-none"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Store Contact Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleFormChange}
                  placeholder="e.g. 7396629821"
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-xs"
                />
              </div>

              {/* Lat / Lng */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-300 font-bold">
                    Store Location (Lat / Lng) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {MAPS_API_KEY && (
                      <button
                        type="button"
                        onClick={() => setIsMapOpen('picker')}
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
                      >
                        <MapPin className="w-3 h-3" />
                        Pick from Map
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDetectMyLocation}
                      className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      Auto-detect
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-500 text-[10px] mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      name="lat"
                      value={form.lat}
                      onChange={handleFormChange}
                      placeholder="e.g. 16.5062"
                      className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-[10px] mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      name="lng"
                      value={form.lng}
                      onChange={handleFormChange}
                      placeholder="e.g. 80.6480"
                      className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-xs font-mono"
                    />
                  </div>
                </div>
                {!MAPS_API_KEY && (
                  <p className="text-zinc-600 text-[10px] mt-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Tip: Add VITE_GOOGLE_MAPS_API_KEY to enable map picker. Find coordinates at maps.google.com.
                  </p>
                )}
              </div>

              {/* Delivery Radius Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-300 font-bold">Delivery Radius</label>
                  <span className="font-black text-white text-sm">
                    {form.deliveryRadiusKm} <span className="text-zinc-400 font-normal text-xs">km</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={form.deliveryRadiusKm}
                  onChange={handleRadiusChange}
                  className="w-full accent-emerald-400 h-2 rounded-full cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
                  <span>0.5 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-zinc-300 font-bold mb-2">Store Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Active', 'Inactive'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, status: s }))}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        form.status === s
                          ? s === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-600'
                          : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {s === 'Active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-100 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving Store...
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4" />
                    {editingStore ? 'Update Store' : 'Create Store'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Map Modal ─────────────────────────────────────────────────────────── */}
      {isMapOpen && (
        <MapPickerModal
          stores={storesList}
          onPickLocation={handleMapPick}
          onClose={() => setIsMapOpen(false)}
          currentLat={form.lat}
          currentLng={form.lng}
        />
      )}
    </div>
  );
};
