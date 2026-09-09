import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';
import { formatFullOrderWhatsApp } from '../utils/whatsapp';
import { checkDeliveryAvailability } from '../utils/deliveryRadius';

// ─── Delivery status constants ────────────────────────────────────────────────
// 'idle'     — location not yet shared
// 'checking' — GPS acquired, querying stores
// 'allowed'  — inside a delivery zone ✅
// 'blocked'  — outside all delivery zones ❌
// 'error'    — GPS failed

export const CheckoutModal = () => {
  const {
    cart,
    isCheckoutOpen,
    setIsCheckoutOpen,
    cartSubtotal,
    discountAmount,
    deliveryFee,
    cartGrandTotal,
    setLastOrder,
    setIsOrderConfirmedOpen,
    clearCart,
    API_BASE_URL,
    showToast,
    fetchProducts,
    verifiedLocation,
    setVerifiedLocation
  } = useShop();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    landmark: '',
    pincode: '',
    area: ''
  });

  // GPS + Delivery Zone State
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | checking | allowed | blocked | error
  const [customerCoords, setCustomerCoords] = useState(null);
  const [locationLink, setLocationLink] = useState('');
  const [locationError, setLocationError] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null); // full result from checkDeliveryAvailability

  // Order state
  const [paymentMethod, setPaymentMethod] = useState('UPI (GPay/PhonePe)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const vijayawadaAreas = ['MG Road', 'Benz Circle', 'Patamata', 'Eluru Road', 'Governorpet', 'Labbipet', 'Kunchanapalli', 'Moghalrajpuram'];

  // Initialize or pre-fill verified location state on modal open
  useEffect(() => {
    if (isCheckoutOpen) {
      // 1. Check if we already have a verified location in context or active session
      const savedVerified = verifiedLocation || (() => {
        try {
          const s = sessionStorage.getItem('quickfit_session_verified_location');
          return s ? JSON.parse(s) : null;
        } catch { return null; }
      })();

      const matchedArea = savedVerified?.areaName && vijayawadaAreas.includes(savedVerified.areaName)
        ? savedVerified.areaName
        : '';

      setFormData({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        landmark: '',
        pincode: '',
        area: matchedArea || ''
      });
      setErrorMsg('');
      setIsSubmitting(false);

      if (savedVerified && typeof savedVerified.lat === 'number' && typeof savedVerified.lng === 'number') {
        const mapsUrl = `https://www.google.com/maps?q=${savedVerified.lat},${savedVerified.lng}`;
        setLocationLink(mapsUrl);
        setCustomerCoords({ lat: savedVerified.lat, lng: savedVerified.lng });
        setLocationError('');

        if (savedVerified.inZone !== false) {
          setLocationStatus('allowed');
          setDeliveryInfo({
            inZone: true,
            nearestStore: savedVerified.nearestStore,
            distanceKm: savedVerified.nearestStore?.distanceKm || null,
            message: `Delivery available from ${savedVerified.nearestStore?.name || 'QuickFit Store'}`
          });
        } else {
          setLocationStatus('blocked');
          setDeliveryInfo({
            inZone: false,
            closestStore: savedVerified.nearestStore,
            distanceKm: savedVerified.nearestStore?.distanceKm || null,
            message: 'Outside express delivery zone.'
          });
        }
      } else {
        setLocationStatus('idle');
        setCustomerCoords(null);
        setLocationLink('');
        setLocationError('');
        setDeliveryInfo(null);
      }
    }
  }, [isCheckoutOpen, verifiedLocation]);

  if (!isCheckoutOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── Step 1: GPS Capture + Step 2: Delivery Zone Validation ─────────────────
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('checking');
    setLocationError('');
    setDeliveryInfo(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocationLink(mapsUrl);
        setCustomerCoords({ lat: latitude, lng: longitude });

        // Immediately validate against all active stores
        try {
          const result = await checkDeliveryAvailability(latitude, longitude, API_BASE_URL);
          setDeliveryInfo(result);

          if (result.inZone) {
            setLocationStatus('allowed');
            showToast(`✅ ${result.message}`, 'success');

            const areaName = result.nearestStore?.address?.split(',')?.[0]?.trim() || result.nearestStore?.name || 'Vijayawada';
            const verifiedData = {
              lat: latitude,
              lng: longitude,
              nearestStore: result.nearestStore,
              inZone: true,
              verificationStatus: 'verified',
              areaName,
              allNearbyStores: result.allStores || []
            };

            try {
              sessionStorage.setItem('quickfit_session_verified_location', JSON.stringify(verifiedData));
              sessionStorage.setItem('quickfit_session_location', JSON.stringify({ lat: latitude, lng: longitude }));
            } catch (e) {}

            if (setVerifiedLocation) {
              setVerifiedLocation(verifiedData);
            }

            // Re-fetch products to ensure catalog updates to the new nearest store
            fetchProducts({ lat: latitude, lng: longitude });
          } else {
            setLocationStatus('blocked');
            showToast('❌ Outside delivery zone. Order blocked.', 'error');

            const verifiedData = {
              lat: latitude,
              lng: longitude,
              nearestStore: result.closestStore,
              inZone: false,
              verificationStatus: 'out_of_range',
              areaName: result.closestStore?.name || 'Outside Delivery Zone',
              allNearbyStores: []
            };
            try {
              sessionStorage.setItem('quickfit_session_verified_location', JSON.stringify(verifiedData));
              sessionStorage.setItem('quickfit_session_location', JSON.stringify({ lat: latitude, lng: longitude }));
            } catch (e) {}

            if (setVerifiedLocation) {
              setVerifiedLocation(verifiedData);
            }
          }
        } catch (err) {
          console.error('[DELIVERY CHECK] Stores API unreachable:', err);
          setLocationStatus('error');
          setLocationError('Could not verify delivery availability. Please try again.');
          showToast('⚠️ Could not check delivery zone. Please retry.', 'error');
        }
      },
      (error) => {
        setLocationStatus('error');
        let msg = 'Could not retrieve GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please enable location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS position unavailable. Please ensure location is enabled on your device.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setLocationError(msg);
        showToast(msg, 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Derived booleans
  const isLocationChecking = locationStatus === 'checking';
  const isLocationAllowed  = locationStatus === 'allowed';
  const isLocationBlocked  = locationStatus === 'blocked';
  const isLocationPending  = locationStatus === 'idle' || locationStatus === 'error';
  // Stores configured but not yet checked → must check first
  const hasStores = deliveryInfo?.allStores?.length > 0;

  // Block if: outside zone OR location not yet verified when stores exist
  // The backend will also enforce this — this is the UX layer
  const canPlaceOrder = isLocationAllowed;

  // ─── Handle Order Submission ─────────────────────────────────────────────────
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName?.trim() || !formData.phone?.trim() || !formData.address?.trim()) {
      setErrorMsg('Please fill in your Full Name, WhatsApp Phone, and Address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build verified store assignment payload
      const assignedStorePayload = deliveryInfo?.nearestStore
        ? {
            id: deliveryInfo.nearestStore._id,
            name: deliveryInfo.nearestStore.name,
            distanceKm: deliveryInfo.distanceKm
              ? parseFloat(deliveryInfo.distanceKm.toFixed(2))
              : null
          }
        : null;

      const storeLatitude = deliveryInfo?.nearestStore?.location?.lat || null;
      const storeLongitude = deliveryInfo?.nearestStore?.location?.lng || null;

      const orderPayload = {
        customer: {
          name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email ? formData.email.trim() : '',
          address: formData.address.trim(),
          landmark: formData.landmark ? formData.landmark.trim() : '',
          pincode: formData.pincode ? formData.pincode.trim() : '520010',
          area: formData.area || 'MG Road'
        },
        customerEmail: formData.email ? formData.email.trim() : '',
        items: cart.map(item => ({
          product: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || item.qty || 1,
          size: item.selectedSize || item.size || 'M',
          color: item.selectedColor || item.color || '',
          image: item.images?.front || item.image || item.imageUrl || ''
        })),
        totalAmount: cartGrandTotal,
        paymentMethod:
          paymentMethod === 'UPI (GPay/PhonePe)'
            ? 'UPI (GPay/PhonePe)'
            : paymentMethod === 'Cash On Delivery'
            ? 'COD'
            : 'Razorpay',
        locationLink: locationLink || 'Not provided',
        customerLocation: customerCoords ? { lat: customerCoords.lat, lng: customerCoords.lng } : null,
        customerLatitude: customerCoords?.lat || null,
        customerLongitude: customerCoords?.lng || null,
        storeLatitude,
        storeLongitude,
        assignedStore: assignedStorePayload
      };

      console.log('🛒 [Submitting Order to Backend]:', `${API_BASE_URL}/orders`, orderPayload);

      const res = await axios.post(`${API_BASE_URL}/orders`, orderPayload);
      const createdOrder = res.data;

      console.log('✅ [Order Created in MongoDB]:', createdOrder);

      const enrichedItems = cart.map(item => ({
        ...item,
        name: item.name,
        price: item.price,
        quantity: item.quantity || item.qty || 1,
        selectedSize: item.selectedSize || item.size || 'M',
        selectedColor: item.selectedColor || item.color || '',
        size: item.selectedSize || item.size || 'M',
        color: item.selectedColor || item.color || '',
        image: item.images?.front || item.image || item.imageUrl || ''
      }));

      setLastOrder({
        ...createdOrder,
        items: enrichedItems,
        customer: { ...(createdOrder.customer || {}), fullName: formData.fullName },
        locationLink: locationLink || createdOrder.locationLink,
        assignedStore: assignedStorePayload
      });

      const waUrl = formatFullOrderWhatsApp({
        orderId: createdOrder.orderId || `QF-${Date.now()}`,
        customer: { ...formData, fullName: formData.fullName },
        items: enrichedItems,
        subtotal: cartSubtotal,
        discount: discountAmount,
        deliveryFee,
        grandTotal: cartGrandTotal,
        paymentMethod,
        locationLink: locationLink || 'Not provided',
        storeName: assignedStorePayload?.name || ''
      });

      clearCart();
      setIsCheckoutOpen(false);
      setIsOrderConfirmedOpen(true);
      fetchProducts();
      showToast('Order placed successfully. A confirmation email has been sent.');
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Checkout error:', err);
      const backendError = err.response?.data?.message || err.message || 'Failed to place order. Please try again.';
      setErrorMsg(backendError);
      showToast(`❌ ${backendError}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-xl w-full my-auto shadow-2xl border border-slate-200 space-y-5 max-h-[94vh] overflow-y-auto animate-in zoom-in-95">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">FAST CHECKOUT</span>
            <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-900">
              Delivery & Order Placement
            </h3>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
            <span className="text-sm mt-0.5">🚫</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PRE-SELECTED PRODUCT / CART SUMMARY */}
        {cart && cart.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {cart.length === 1 ? 'Selected Product' : `Order Items (${cart.length})`}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ⚡ Express 60-Min Dispatch
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
              {cart.map((item, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 truncate text-xs">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span>Size: <strong className="text-slate-800 font-bold">{item.selectedSize || item.size || 'M'}</strong></span>
                        {item.selectedColor || item.color ? (
                          <span>· Color: <strong className="text-slate-800 font-bold">{item.selectedColor || item.color}</strong></span>
                        ) : null}
                        <span>· Qty: <strong className="text-slate-800 font-bold">{item.quantity || 1}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="font-black text-slate-900 font-mono text-sm shrink-0">
                    ₹{(item.price || 0) * (item.quantity || 1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs" autoComplete="off">

          {/* CUSTOMER DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="input-field"
                autoComplete="off"
                data-form-type="other"
              />
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">WhatsApp Phone *</label>
              <input
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter WhatsApp mobile number"
                className="input-field"
                autoComplete="off"
                data-form-type="other"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Email Address <span className="text-emerald-600 font-normal text-[11px]">(Confirmation receipt sent here)</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. name@gmail.com"
              className="input-field"
              autoComplete="off"
              data-form-type="other"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Delivery Address *</label>
            <textarea
              rows="2"
              required
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Flat / House No., Building Name, Street address..."
              className="input-field"
              autoComplete="off"
              data-form-type="other"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Area *</label>
              <select name="area" value={formData.area} onChange={handleChange} className="input-field cursor-pointer" autoComplete="off">
                <option value="">Select Area in Vijayawada...</option>
                {vijayawadaAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">Landmark (Optional)</label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="e.g. Near PVP Mall"
                className="input-field"
                autoComplete="off"
                data-form-type="other"
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* GPS LOCATION + DELIVERY ZONE VALIDATION (MANDATORY)               */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLocationAllowed ? 'bg-emerald-50 border-emerald-200' :
            isLocationBlocked ? 'bg-rose-50 border-rose-200' :
            'bg-slate-50 border-slate-200'
          }`}>

            <div className="flex items-center justify-between">
              <span className={`font-extrabold text-xs flex items-center gap-1.5 ${
                isLocationAllowed ? 'text-emerald-800' :
                isLocationBlocked ? 'text-rose-800' :
                'text-slate-900'
              }`}>
                <span>📍</span>
                <span>Delivery Zone Verification</span>
                <span className="text-rose-500 font-black">*Required</span>
              </span>
              {isLocationAllowed && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ Verified
                </span>
              )}
            </div>

            {/* IDLE / ERROR — show the share location button */}
            {(isLocationPending) && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleShareLocation}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>📍</span>
                  <span>Share My Location & Check Delivery Availability</span>
                </button>
                {locationError && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold flex items-start gap-1.5">
                    <span>⚠️</span>
                    <span>{locationError}</span>
                  </div>
                )}
                <p className="text-slate-500 text-[10px] text-center">
                  Location verification is required to confirm delivery availability in your area.
                </p>
              </div>
            )}

            {/* CHECKING — spinner */}
            {isLocationChecking && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin shrink-0"></span>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Detecting your location...</p>
                    <p className="text-slate-500 text-[10px]">Checking delivery availability in your area</p>
                  </div>
                </div>
              </div>
            )}

            {/* ALLOWED ✅ */}
            {isLocationAllowed && deliveryInfo && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-emerald-200">
                  <span className="text-xl shrink-0">✅</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-emerald-800 text-xs">Delivery Available!</p>
                    {deliveryInfo.nearestStore && (
                      <>
                        <p className="text-emerald-700 text-[11px] font-semibold mt-0.5">
                          📦 {deliveryInfo.nearestStore.name}
                        </p>
                        {deliveryInfo.distanceKm && (
                          <p className="text-emerald-600 text-[10px] mt-0.5 font-mono">
                            {deliveryInfo.distanceKm.toFixed(1)} km from your location
                            {' '}· covers up to {deliveryInfo.nearestStore.deliveryRadiusKm} km
                          </p>
                        )}
                      </>
                    )}
                    <a
                      href={locationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-emerald-600 hover:underline mt-1 flex items-center gap-1"
                    >
                      📍 View your location
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={handleShareLocation}
                    className="text-[10px] text-emerald-700 hover:underline font-bold shrink-0 cursor-pointer"
                  >
                    Re-check
                  </button>
                </div>
              </div>
            )}

            {/* BLOCKED ❌ */}
            {isLocationBlocked && deliveryInfo && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-rose-200">
                  <span className="text-xl shrink-0">❌</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-rose-800 text-xs">Delivery Not Available</p>
                    <p className="text-rose-700 text-[11px] font-semibold mt-0.5">
                      Sorry, we are currently not available in your location.
                    </p>
                    {deliveryInfo.closestStore && deliveryInfo.distanceKm && (
                      <p className="text-rose-600 text-[10px] mt-1 font-mono">
                        Nearest store: {deliveryInfo.closestStore.name} ({deliveryInfo.distanceKm.toFixed(1)} km away
                        {' '}· delivers up to {deliveryInfo.closestStore.deliveryRadiusKm} km only)
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleShareLocation}
                    className="text-[10px] text-rose-600 hover:underline font-bold shrink-0 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
                <p className="text-rose-700 text-[10px] text-center font-semibold">
                  🚫 Checkout is disabled until you are within a delivery zone.
                </p>
              </div>
            )}
          </div>

          {/* PAYMENT METHOD */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {['UPI (GPay/PhonePe)', 'Cash On Delivery'].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMethod(mode)}
                  className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                    paymentMethod === mode
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* ORDER TOTAL */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-black">Grand Total</div>
              <div className="text-xl font-black font-heading">₹{cartGrandTotal}</div>
            </div>
            <div className="text-right text-[10px] text-slate-300 font-semibold">
              <div>{cart.length} Item(s)</div>
              <div className="text-emerald-400 font-bold">Free Express Delivery</div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* SUBMIT BUTTON                              */}
          {/* ═══════════════════════════════════════════ */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg transition-all flex items-center justify-center gap-2 !min-h-[48px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Placing Order & Sending Email...</span>
              </>
            ) : (
              <>
                <span>🛍️</span>
                <span>Place Order & Confirm Dispatch ➔</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};
