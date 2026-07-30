import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { formatFullOrderWhatsApp, formatMailtoNotification } from '../utils/whatsapp';

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
    clearCart
  } = useShop();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: 'saggurthisubbu9@gmail.com',
    address: '',
    landmark: '',
    pincode: '520010',
    area: 'MG Road'
  });

  const [paymentMethod, setPaymentMethod] = useState('UPI (GPay/PhonePe)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCheckoutOpen) return null;

  const vijayawadaAreas = ['MG Road', 'Benz Circle', 'Patamata', 'Eluru Road', 'Governorpet', 'Labbipet', 'Kunchanapalli', 'Moghalrajpuram'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.address) {
      setErrorMsg('Please fill in your Full Name, WhatsApp Phone, and Address.');
      return;
    }

    setIsSubmitting(true);

    // 1. Generate Order ID in QF-XXXXXX format
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderId = `QF-${randomDigits}`;

    const orderPayload = {
      orderId,
      customer: formData,
      items: cart,
      subtotal: cartSubtotal,
      discount: discountAmount,
      deliveryFee,
      grandTotal: cartGrandTotal,
      paymentMethod,
      timestamp: new Date().toLocaleString()
    };

    setLastOrder(orderPayload);

    // 2. Format WhatsApp URL and open
    const waUrl = formatFullOrderWhatsApp(orderPayload);
    window.open(waUrl, '_blank');

    // 3. Trigger Email Mailto prompt for saggurthisubbu9@gmail.com
    const mailtoUrl = formatMailtoNotification(orderPayload);
    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 1000);

    // 4. Transition UI to Confirmation Modal
    setTimeout(() => {
      setIsSubmitting(false);
      setIsCheckoutOpen(false);
      clearCart();
      setIsOrderConfirmedOpen(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      {/* BACKDROP */}
      <div
        onClick={() => setIsCheckoutOpen(false)}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
      ></div>

      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-slate-100">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              📍
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-slate-900">Vijayawada Express Checkout</h2>
              <p className="text-xs text-slate-500">Guaranteed 60-Minute Doorstep Delivery</p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-5">
          
          {/* CUSTOMER INFO */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">1. Customer Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Subrahmanyam Saggurthi"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Phone (+91) *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 7396629821"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email (For Order Invoice & Target Notification)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="saggurthisubbu9@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* DELIVERY ADDRESS */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">2. Vijayawada Delivery Address (Within 5 KM Radius)</h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Flat / House No. & Street Address *</label>
              <textarea
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                placeholder="Door No. 40-1-12, Opposite Trendset Mall..."
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Vijayawada Area</label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {vijayawadaAreas.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Landmark</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="Near Benz Circle"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="520010"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">3. Select Payment Method</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'UPI (GPay/PhonePe)', label: '📱 UPI / QR Code', sub: 'GPay, PhonePe, Paytm' },
                { id: 'Cash On Delivery', label: '💵 Cash On Delivery', sub: 'Pay after doorstep try-on' },
                { id: 'Card On Delivery', label: '💳 Card On Delivery', sub: 'Rider carries POS machine' }
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === m.id
                      ? 'border-blue-600 bg-blue-50/80 shadow-md'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{m.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ORDER SUMMARY BANNER */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Total Payable Amount</div>
              <div className="text-2xl font-black font-heading text-blue-400">₹{cartGrandTotal}</div>
            </div>
            <div className="text-right text-[11px] text-orange-400 font-bold">
              ⚡ Guaranteed Delivery in 60 Mins
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Generating Order QF-XXXXXX...</span>
            ) : (
              <>
                <span>Confirm & Place 60-Min Express Order</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>

        </form>

      </div>

    </div>
  );
};
