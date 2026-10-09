import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';
import { formatFullOrderWhatsApp } from '../utils/whatsapp';
import { checkDeliveryAvailability, verifyDeliveryAddress } from '../utils/deliveryRadius';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/api';

export const CheckoutModal = () => {
  const {
    cart,
    setCart,
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
    user,
    updateCustomerProfile
  } = useShop();

  // Two-step checkout flow: 'details' -> 'confirmation'
  const [checkoutStep, setCheckoutStep] = useState('details');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    landmark: '',
    pincode: '',
    area: 'Benz Circle'
  });

  // Delivery Zone State (Verified from Delivery Address, NOT customer's device GPS)
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | checking | allowed | blocked | error
  const [customerCoords, setCustomerCoords] = useState(null);
  const [locationLink, setLocationLink] = useState('');
  const [locationError, setLocationError] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null); // full result from verifyDeliveryAddress

  // Order state
  const [paymentMethod, setPaymentMethod] = useState('UPI (GPay/PhonePe)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const vijayawadaAreas = ['MG Road', 'Benz Circle', 'Patamata', 'Eluru Road', 'Governorpet', 'Labbipet', 'Kunchanapalli', 'Moghalrajpuram'];

  // Core Delivery Verification: Checks customer's Delivery Address against RS FASHIONS 10 km zone
  const runDeliveryVerification = useCallback(async (currentData, notify = false) => {
    setLocationStatus('checking');
    setLocationError('');

    try {
      const result = await verifyDeliveryAddress(currentData, API_BASE_URL);
      setDeliveryInfo(result);

      if (result.lat && result.lng) {
        setCustomerCoords({ lat: result.lat, lng: result.lng });
        setLocationLink(`https://www.google.com/maps?q=${result.lat},${result.lng}`);
      }

      if (result.inZone) {
        setLocationStatus('allowed');
        setLocationError('');
        if (notify) {
          showToast('Delivery available from RS FASHIONS', 'success');
        }
        return { allowed: true, result };
      } else {
        setLocationStatus('blocked');
        const blockedMsg = 'Sorry, we are currently not available at this location.';
        setLocationError(blockedMsg);
        if (notify) {
          showToast(blockedMsg, 'error');
        }
        return { allowed: false, result };
      }
    } catch (err) {
      console.error('[Delivery Verification Error]:', err);
      setLocationStatus('error');
      setLocationError('Could not verify delivery address. Please try again.');
      return { allowed: false, error: err };
    }
  }, [API_BASE_URL, showToast]);

  // Initialize and automatically pre-fill saved customer details on modal open
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isCheckoutOpen && !prevOpenRef.current) {
      setCheckoutStep('details');
      setErrorMsg('');
      setIsSubmitting(false);

      // Automatically load saved customer details if available
      const savedAddr = user?.address || {};
      const initialStreet = savedAddr.fullAddress || savedAddr.street || (typeof user?.address === 'string' ? user.address : '');
      const initialArea = savedAddr.area || 'Benz Circle';

      const initialData = {
        fullName: user?.name || '',
        phone: user?.phone || '',
        email: user?.email && !user.email.endsWith('@customer.quickfit.in') ? user.email : '',
        address: initialStreet || '',
        landmark: savedAddr.landmark || '',
        pincode: savedAddr.pincode || '520010',
        area: initialArea
      };

      setFormData(initialData);

      // Automatically verify the initial delivery address against RS FASHIONS 10 km zone
      runDeliveryVerification(initialData, false);
    }
    prevOpenRef.current = isCheckoutOpen;
  }, [isCheckoutOpen, user, runDeliveryVerification]);

  if (!isCheckoutOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setErrorMsg('');

    // When Area, Pincode, Address, or Landmark is changed, re-verify delivery location
    if (name === 'area' || name === 'pincode' || name === 'address' || name === 'landmark') {
      runDeliveryVerification(updated, false);
    }
  };

  // Helper to update a cart item's size in checkout
  const handleUpdateItemSize = (index, newSize) => {
    if (setCart) {
      setCart(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            selectedSize: newSize,
            size: newSize
          };
        }
        return updated;
      });
    }
  };

  // Manual Trigger: Verify Delivery Availability for the entered Delivery Address
  const handleVerifyDeliveryAvailability = async () => {
    if (!formData.address?.trim() && !formData.area) {
      setLocationError('Please enter your delivery street address and area.');
      showToast('Please enter your delivery address to verify.', 'warning');
      return;
    }
    await runDeliveryVerification(formData, true);
  };

  const isLocationChecking = locationStatus === 'checking';
  const isLocationAllowed  = locationStatus === 'allowed';
  const isLocationBlocked  = locationStatus === 'blocked';
  const isLocationPending  = locationStatus === 'idle' || locationStatus === 'error';

  // ─── Step 1 -> Step 2: Validate Details & Move to Confirmation ───────────────
  const handleProceedToConfirmation = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName?.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    const cleanPhone = String(formData.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile/WhatsApp number.');
      return;
    }
    if (!formData.address?.trim()) {
      setErrorMsg('Please enter your delivery street address.');
      return;
    }

    if (isLocationBlocked) {
      setErrorMsg('Sorry, we are currently not available at this location.');
      showToast('Sorry, we are currently not available at this location.', 'error');
      return;
    }

    if (!isLocationAllowed) {
      // Run quick verification on the current address before proceeding
      const verifyRes = await runDeliveryVerification(formData, false);
      if (!verifyRes.allowed) {
        setErrorMsg('Sorry, we are currently not available at this location.');
        showToast('Sorry, we are currently not available at this location.', 'error');
        return;
      }
    }

    // Size validation: If size is required, customer MUST select a size before continuing
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0;
      const chosenSize = item.selectedSize || item.size;
      if (hasSizes && (!chosenSize || chosenSize === '')) {
        setErrorMsg(`Please select a size for "${item.name}" before proceeding.`);
        showToast(`Please select a size for "${item.name}".`, 'warning');
        return;
      }
    }

    // Persist edited customer details for future visits
    if (updateCustomerProfile) {
      updateCustomerProfile({
        name: formData.fullName.trim(),
        email: formData.email ? formData.email.trim() : '',
        phone: cleanPhone,
        address: {
          street: formData.address.trim(),
          fullAddress: formData.address.trim(),
          area: formData.area || 'Benz Circle',
          landmark: formData.landmark ? formData.landmark.trim() : '',
          pincode: formData.pincode ? formData.pincode.trim() : '520010',
          city: 'Vijayawada'
        }
      }).catch(err => console.error('[Profile update background error]:', err));
    }

    // Move to Order Confirmation step
    setCheckoutStep('confirmation');
  };

  // ─── Step 2: Final Order Submission upon clicking "Confirm Order" ─────────────
  const handleFinalOrderConfirm = async () => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const rsStore = deliveryInfo?.store || deliveryInfo?.nearestStore || null;
      const storeLatitude = rsStore?.location?.lat || 16.5336383;
      const storeLongitude = rsStore?.location?.lng || 80.6464595;
      const distanceNumber = deliveryInfo?.distanceKm !== null && deliveryInfo?.distanceKm !== undefined
        ? parseFloat(Number(deliveryInfo.distanceKm).toFixed(2))
        : null;

      const assignedStorePayload = {
        id: rsStore?._id || '6a8165f4b2980c896c692183',
        name: 'RS FASHIONS',
        distanceKm: distanceNumber
      };

      const fullDeliveryAddress = [
        formData.address.trim(),
        formData.landmark ? `Landmark: ${formData.landmark.trim()}` : '',
        formData.area || 'Benz Circle',
        formData.pincode ? `Pincode: ${formData.pincode.trim()}` : '',
        'Vijayawada'
      ].filter(Boolean).join(', ');

      const orderPayload = {
        customer: {
          name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email ? formData.email.trim() : '',
          address: formData.address.trim(),
          landmark: formData.landmark ? formData.landmark.trim() : '',
          pincode: formData.pincode ? formData.pincode.trim() : '520010',
          area: formData.area || 'Benz Circle'
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
        locationLink: locationLink || (customerCoords ? `https://www.google.com/maps?q=${customerCoords.lat},${customerCoords.lng}` : 'Not provided'),
        customerLocation: customerCoords ? { lat: customerCoords.lat, lng: customerCoords.lng } : null,
        customerLatitude: customerCoords?.lat || null,
        customerLongitude: customerCoords?.lng || null,
        storeLatitude,
        storeLongitude,
        assignedStore: assignedStorePayload,
        deliveryDistanceKm: distanceNumber,
        deliveryAddress: fullDeliveryAddress
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

      // Dispatch immediate order event so admin alert & loud looping buzzer trigger without delay
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('quickfit_new_order', {
          detail: { ...createdOrder, items: enrichedItems }
        }));
      }

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
      showToast('Order confirmed and placed successfully! 🎉');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full my-auto shadow-2xl border border-slate-200 space-y-4 max-h-[94vh] overflow-y-auto animate-in zoom-in-95 text-xs">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                checkoutStep === 'details' ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Step 1: Details {checkoutStep === 'confirmation' ? '✓' : ''}
              </span>
              <span className="text-slate-300">➔</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                checkoutStep === 'confirmation' ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-400/40' : 'bg-slate-100 text-slate-500'
              }`}>
                Step 2: Order Confirmation
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-900">
              {checkoutStep === 'details' ? 'Delivery & Customer Details' : 'Order Confirmation'}
            </h3>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ERROR ALERT */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
            <span className="text-sm mt-0.5">🚫</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* STAGE 1: CUSTOMER DETAILS & DELIVERY LOCATION                         */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {checkoutStep === 'details' && (
          <form onSubmit={handleProceedToConfirmation} className="space-y-4" autoComplete="off">

            {/* PRE-FILLED CUSTOMER NOTICE */}
            {user?.name && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <span>
                    Saved details for <strong className="text-slate-900">{user.name}</strong> loaded. You can edit them below.
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Editable</span>
              </div>
            )}

            {/* CUSTOMER INPUTS */}
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
                  placeholder="10-digit mobile number"
                  className="input-field font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Area / Locality *</label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="input-field font-semibold"
                >
                  {vijayawadaAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Street Address *</label>
              <textarea
                required
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="House / Flat No., Apartment Name, Street Name"
                className="input-field resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="e.g. Near Benz Circle"
                  className="input-field"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="520010"
                  className="input-field font-mono"
                />
              </div>
            </div>

            {/* GPS LOCATION & DELIVERY ZONE CHECK */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>Delivery Zone GPS Verification</span>
                </span>
                {isLocationAllowed && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Verified Zone ✅
                  </span>
                )}
                {isLocationBlocked && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                    Outside Zone ✕
                  </span>
                )}
              </div>

              {isLocationAllowed ? (
                <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  <div className="text-emerald-900 font-medium">
                    {deliveryInfo?.message || '⚡ Delivery available from RS FASHIONS'}
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyDeliveryAvailability}
                    className="text-[10px] text-emerald-800 underline font-bold cursor-pointer"
                  >
                    Re-verify
                  </button>
                </div>
              ) : isLocationBlocked ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                    <div className="text-rose-900 font-medium">
                      🚫 {locationError || 'Sorry, we are currently not available at this location.'}
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyDeliveryAvailability}
                      className="text-[10px] text-rose-800 underline font-bold cursor-pointer"
                    >
                      Re-verify
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    QuickFit delivers within Vijayawada in 60 minutes. Click below to verify your address coordinates.
                  </p>
                  <button
                    type="button"
                    disabled={isLocationChecking}
                    onClick={handleVerifyDeliveryAvailability}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isLocationChecking ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Checking Store Proximity...</span>
                      </>
                    ) : (
                      <>
                        <span>📍</span>
                        <span>Verify Delivery Availability</span>
                      </>
                    )}
                  </button>
                  {locationError && (
                    <p className="text-rose-600 text-[11px] font-semibold">{locationError}</p>
                  )}
                </div>
              )}
            </div>

            {/* PAYMENT METHOD */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {['UPI (GPay/PhonePe)', 'Cash On Delivery'].map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setPaymentMethod(mode)}
                    className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      paymentMethod === mode
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* PROCEED BUTTON */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold uppercase tracking-wider text-xs shadow-lg transition-all flex items-center justify-center gap-2 !min-h-[48px] cursor-pointer"
            >
              <span>Review & Confirm Order ➔</span>
            </button>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* STAGE 2: ORDER CONFIRMATION STEP                                      */}
        {/* Customer must confirm: Product, Image, Size, Qty, Price, Address,     */}
        {/* Phone, Email. Then click "Confirm Order".                             */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {checkoutStep === 'confirmation' && (
          <div className="space-y-4">

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="text-xs font-bold">
                  Please review all items & delivery details before final confirmation.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStep('details')}
                className="text-xs font-black text-amber-800 underline hover:text-amber-950 cursor-pointer"
              >
                Edit Details
              </button>
            </div>

            {/* 1. PRODUCT CONFIRMATION (PRODUCT, IMAGE, SIZE, QUANTITY, PRICE) */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-between">
                <span>Products to Confirm ({cart.length})</span>
                <span className="text-slate-400">Express Dispatch</span>
              </div>

              <div className="p-3 divide-y divide-slate-100 space-y-3">
                {cart.map((item, idx) => {
                  const frontImg = resolveImageUrl(item.images?.front || item.image);
                  const itemSizes = Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
                  const chosenSize = item.selectedSize || item.size || 'M';

                  return (
                    <div key={idx} className="pt-3 first:pt-0 flex gap-3 items-start">
                      {/* Product Image */}
                      <img
                        src={frontImg}
                        alt={item.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE;
                        }}
                        className="w-16 h-20 object-cover object-top rounded-xl border border-slate-200 bg-white shrink-0 shadow-xs"
                      />

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">
                          {item.name}
                        </h4>

                        {/* Size Selection Confirmation */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-700">Size:</span>
                          <div className="flex items-center gap-1">
                            {itemSizes.map(sz => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => handleUpdateItemSize(idx, sz)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border transition-all cursor-pointer ${
                                  chosenSize === sz
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quantity & Unit Price */}
                        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                          <span className="font-semibold">
                            Quantity: <strong className="text-slate-900">{item.quantity || 1}</strong>
                          </span>
                          <span className="font-extrabold text-slate-900 font-mono text-sm">
                            ₹{(item.price || 0) * (item.quantity || 1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. CUSTOMER & DELIVERY ADDRESS CONFIRMATION */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                  Delivery Details Confirmation
                </span>
                <button
                  type="button"
                  onClick={() => setCheckoutStep('details')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Change Address
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Customer Name</span>
                  <span className="font-extrabold text-slate-900">{formData.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Phone Number</span>
                  <span className="font-bold text-slate-900 font-mono">+91 {formData.phone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Email Address</span>
                  <span className="font-semibold text-slate-900">{formData.email || 'None (WhatsApp updates only)'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Delivery Address</span>
                  <span className="font-medium text-slate-900 leading-relaxed">
                    {formData.address}, {formData.area}
                    {formData.landmark ? `, Landmark: ${formData.landmark}` : ''}
                    {formData.pincode ? ` - ${formData.pincode}` : ''}, Vijayawada
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Payment Mode</span>
                  <span className="font-bold text-slate-900">{paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Store Dispatch</span>
                  <span className="font-bold text-emerald-700">
                    ⚡ Delivery available from RS FASHIONS {deliveryInfo?.distanceKm ? `(~${deliveryInfo.distanceKm} km away)` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. ORDER PRICING SUMMARY */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Items Subtotal</span>
                <span className="font-mono">₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Express Delivery Fee</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs font-bold">
                  <span>Discount Applied</span>
                  <span className="font-mono">-₹{discountAmount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-black text-sm uppercase tracking-wider text-slate-200">
                  Total Payable Amount
                </span>
                <span className="text-xl font-black font-heading text-amber-400 font-mono">
                  ₹{cartGrandTotal}
                </span>
              </div>
            </div>

            {/* 4. CONFIRM ORDER ACTION BUTTON */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalOrderConfirm}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white font-extrabold uppercase tracking-wider text-sm shadow-xl shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed !min-h-[50px] active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing & Submitting Order...</span>
                  </>
                ) : (
                  <>
                    <span>🛍️</span>
                    <span>Confirm Order (₹{cartGrandTotal}) ➔</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCheckoutStep('details')}
                className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                ← Back to Edit Delivery Details
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CheckoutModal;
