import React, { useState } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';
import { formatFullOrderWhatsApp } from '../utils/whatsapp';

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
    fetchProducts
  } = useShop();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    landmark: '',
    pincode: '520010',
    area: 'MG Road'
  });

  const [locationLink, setLocationLink] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('UPI (GPay/PhonePe)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCheckoutOpen) return null;

  const vijayawadaAreas = ['MG Road', 'Benz Circle', 'Patamata', 'Eluru Road', 'Governorpet', 'Labbipet', 'Kunchanapalli', 'Moghalrajpuram'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- GPS GEOLOCATION HANDLER ---
  const handleFetchGPS = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      showToast('Geolocation is not supported on this device.', 'error');
      return;
    }

    setIsFetchingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocationLink(mapsUrl);
        setIsFetchingLocation(false);
        showToast('GPS Location captured successfully! 📍');
      },
      (error) => {
        setIsFetchingLocation(false);
        let msg = 'Could not retrieve GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable. Please ensure GPS is ON.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setLocationError(msg);
        showToast(msg, 'warning');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.address) {
      setErrorMsg('Please fill in your Full Name, WhatsApp Phone, and Address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Prepare Order Payload
      const orderPayload = {
        customer: {
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email || '',
          address: formData.address,
          landmark: formData.landmark,
          pincode: formData.pincode,
          area: formData.area
        },
        items: cart.map(item => ({
          product: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.selectedSize || 'M',
          color: item.selectedColor || '',
          image: item.images?.front || item.image
        })),
        totalAmount: cartGrandTotal,
        paymentMethod: paymentMethod === 'UPI (GPay/PhonePe)' ? 'UPI (GPay/PhonePe)' : paymentMethod === 'Cash On Delivery' ? 'COD' : 'Razorpay',
        locationLink: locationLink || 'Not provided'
      };

      let createdOrder;
      try {
        const res = await axios.post(`${API_BASE_URL}/orders`, orderPayload);
        createdOrder = res.data;
      } catch (err) {
        console.warn('Backend server offline during order post, generating offline confirmation');
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        createdOrder = {
          orderId: `QF-VJ-${randomDigits}`,
          customer: { ...formData, fullName: formData.fullName },
          items: cart,
          totalAmount: cartGrandTotal,
          paymentMethod,
          locationLink,
          orderDate: new Date().toISOString()
        };
      }

      setLastOrder({
        ...createdOrder,
        locationLink: locationLink || createdOrder.locationLink
      });

      // Format WhatsApp order URL
      const waUrl = formatFullOrderWhatsApp({
        orderId: createdOrder.orderId || `QF-${Date.now()}`,
        customer: { ...formData, fullName: formData.fullName },
        items: cart,
        subtotal: cartSubtotal,
        discount: discountAmount,
        deliveryFee,
        grandTotal: cartGrandTotal,
        paymentMethod,
        locationLink: locationLink || 'Not provided'
      });

      // Clear Bag & Refresh Catalog
      clearCart();
      setIsCheckoutOpen(false);
      setIsOrderConfirmedOpen(true);
      fetchProducts();

      // Open WhatsApp Dispatch in new tab
      window.open(waUrl, '_blank');
      showToast('Order created! Dispatching details on WhatsApp 📲');
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-xl w-full my-auto shadow-2xl border border-slate-200 space-y-5 max-h-[94vh] overflow-y-auto animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              FAST CHECKOUT
            </span>
            <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-900">
              Delivery & Order Placement
            </h3>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
          
          {/* CUSTOMER CONTACT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Subrahmanyam"
                className="input-field"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">WhatsApp Phone Number *</label>
              <input
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 7396629821"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Email Address (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@domain.com"
              className="input-field"
            />
          </div>

          {/* DELIVERY ADDRESS */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">Doorstep Delivery Address *</label>
            <textarea
              rows="2"
              required
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Flat / House No., Building Name, Street..."
              className="input-field"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Vijayawada Area *</label>
              <select
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="input-field cursor-pointer"
              >
                {vijayawadaAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Landmark</label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="e.g. Near PVP Mall"
                className="input-field"
              />
            </div>
          </div>

          {/* GPS LOCATION SHARING COMPONENT */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <span>📍</span>
                <span>Current GPS Location</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                Ensures exact doorstep delivery
              </span>
            </div>

            {locationLink ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm">✓</span>
                  <a
                    href={locationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold underline truncate max-w-[280px]"
                  >
                    {locationLink}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleFetchGPS}
                  className="text-[10px] font-bold text-emerald-700 hover:underline flex-shrink-0 ml-2"
                >
                  Update GPS
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFetchGPS}
                disabled={isFetchingLocation}
                className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                {isFetchingLocation ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></span>
                    <span>Acquiring GPS Satellite Signal...</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>Share Current Location (Auto-Fill Maps Link)</span>
                  </>
                )}
              </button>
            )}

            {locationError && (
              <div className="text-amber-700 text-[10px] font-semibold">
                ⚠️ {locationError}
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
                  className={`p-3 rounded-xl border text-xs font-black transition-all ${
                    paymentMethod === mode
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* ORDER TOTAL SUMMARY */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-black">Grand Total</div>
              <div className="text-xl font-black font-heading">₹{cartGrandTotal}</div>
            </div>
            <div className="text-right text-[10px] text-slate-300 font-semibold">
              <div>{cart.length} Item(s) Selected</div>
              <div className="text-emerald-400 font-bold">Free Express Delivery</div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg transition-all flex items-center justify-center gap-2 !min-h-[48px]"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Connecting to WhatsApp...</span>
              </>
            ) : (
              <>
                <span>💬</span>
                <span>Confirm & Send Order via WhatsApp ➔</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
