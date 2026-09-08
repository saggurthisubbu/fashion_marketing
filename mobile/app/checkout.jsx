import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import axios from 'axios';
import { useShop } from '../context/ShopContext';
import { Colors } from '../constants/colors';
import { formatFullOrderWhatsApp } from '../utils/whatsapp';
import { checkDeliveryAvailability } from '../utils/deliveryRadius';

const AREAS = ['MG Road','Benz Circle','Patamata','Eluru Road','Governorpet','Labbipet','Kunchanapalli','Moghalrajpuram'];
const PAYMENT_METHODS = ['UPI (GPay/PhonePe)','Cash on Delivery','Bank Transfer'];

export default function CheckoutScreen() {
  const {
    cart, cartSubtotal, discountAmount, deliveryFee, cartGrandTotal,
    setLastOrder, setIsOrderConfirmedOpen, clearCart, API_BASE_URL, showToast,
    verifiedLocation, setVerifiedLocation, user,
  } = useShop();

  const [form, setForm] = useState({ fullName: user?.name || '', phone: user?.phone || '', email: user?.email || '', address: '', landmark: '', pincode: '', area: '' });
  const [paymentMethod, setPaymentMethod] = useState('UPI (GPay/PhonePe)');
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationLink, setLocationLink] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const safeCart = cart.filter(i => i && i.id && i.name);

  const updateForm = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleGetLocation = async () => {
    setLocationStatus('checking');
    setErrorMsg('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('error');
        setErrorMsg('Location permission denied. Please allow location access in your phone settings.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const link = 'https://www.google.com/maps?q=' + latitude + ',' + longitude;
      setLocationLink(link);

      const result = await checkDeliveryAvailability(latitude, longitude, API_BASE_URL);
      setDeliveryInfo(result);

      const verifiedData = {
        lat: latitude, lng: longitude, inZone: result.inZone,
        nearestStore: result.nearestStore, allNearbyStores: result.allStores || [],
        areaName: result.nearestStore?.name || 'Your Area',
      };
      setVerifiedLocation(verifiedData);

      if (result.inZone) {
        setLocationStatus('allowed');
        showToast('Delivery available at your location!');
      } else {
        setLocationStatus('blocked');
        setErrorMsg(result.message || 'Sorry, we do not deliver to your area currently.');
      }
    } catch (err) {
      setLocationStatus('error');
      setErrorMsg('Could not get your location. Please try again.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!form.fullName || !form.phone) { setErrorMsg('Please fill Name and Phone.'); return; }
    if (safeCart.length === 0) { setErrorMsg('Your cart is empty.'); return; }
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const orderData = {
        customer: { ...form, locationLink },
        items: safeCart.map(item => ({
          product: item._id || item.id,
          name: item.name,
          size: item.selectedSize || item.size || 'M',
          color: item.selectedColor || item.color || '',
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        deliveryFee,
        grandTotal: cartGrandTotal,
        paymentMethod,
        locationLink,
        deliveryInfo: deliveryInfo || {},
        source: 'mobile',
      };

      const res = await axios.post(`${API_BASE_URL}/orders`, orderData, { timeout: 20000 });
      const orderId = res.data?.orderId || res.data?._id || 'QF-' + Date.now();

      const waUrl = formatFullOrderWhatsApp({
        orderId,
        customer: { ...form, locationLink },
        items: safeCart,
        subtotal: cartSubtotal,
        discount: discountAmount,
        deliveryFee,
        grandTotal: cartGrandTotal,
        paymentMethod,
        locationLink,
      });

      setLastOrder({ orderId, ...orderData });
      clearCart();
      setIsSubmitting(false);

      Alert.alert(
        'Order Placed! 🎉',
        'Your order has been confirmed. Opening WhatsApp to complete the order...',
        [{
          text: 'Open WhatsApp',
          onPress: async () => {
            try { await Linking.openURL(waUrl); } catch {}
            router.replace('/(tabs)');
          },
        }]
      );
    } catch (err) {
      setIsSubmitting(false);
      const msg = err.response?.data?.message || err.message || 'Order failed. Please try again.';
      setErrorMsg(msg);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      {/* ORDER SUMMARY */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Order Summary ({safeCart.length} items)</Text>
        {safeCart.map((item, idx) => (
          <View key={idx} style={s.orderItem}>
            <Text style={s.orderItemName} numberOfLines={1}>{item.name}</Text>
            <Text style={s.orderItemDetail}>Size: {item.selectedSize} · Qty: {item.quantity}</Text>
            <Text style={s.orderItemPrice}>Rs.{item.price * item.quantity}</Text>
          </View>
        ))}
        <View style={s.divider} />
        <View style={s.sumRow}><Text style={s.sumLabel}>Subtotal</Text><Text style={s.sumVal}>Rs.{cartSubtotal}</Text></View>
        {discountAmount > 0 && <View style={s.sumRow}><Text style={[s.sumLabel, { color: Colors.emerald600 }]}>Discount</Text><Text style={[s.sumVal, { color: Colors.emerald600 }]}>-Rs.{discountAmount}</Text></View>}
        <View style={s.sumRow}><Text style={s.sumLabel}>Delivery</Text><Text style={s.sumVal}>{deliveryFee === 0 ? 'FREE' : 'Rs.' + deliveryFee}</Text></View>
        <View style={[s.sumRow, { marginTop: 8 }]}><Text style={s.totalLabel}>Total</Text><Text style={s.totalVal}>Rs.{cartGrandTotal}</Text></View>
      </View>

      {/* CUSTOMER DETAILS */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Delivery Details</Text>
        {[
          { field: 'fullName', label: 'Full Name *', placeholder: 'Your full name', autoCapitalize: 'words' },
          { field: 'phone', label: 'Phone *', placeholder: '+91 XXXXX XXXXX', keyboardType: 'phone-pad' },
          { field: 'email', label: 'Email', placeholder: 'you@example.com', keyboardType: 'email-address', autoCapitalize: 'none' },
          { field: 'address', label: 'Address *', placeholder: 'Street address', autoCapitalize: 'sentences' },
          { field: 'landmark', label: 'Landmark', placeholder: 'Near temple, school...' },
          { field: 'pincode', label: 'Pincode', placeholder: '520001', keyboardType: 'numeric' },
        ].map(({ field, label, ...rest }) => (
          <View key={field}>
            <Text style={s.inputLabel}>{label}</Text>
            <TextInput
              style={s.input}
              value={form[field]}
              onChangeText={val => updateForm(field, val)}
              placeholderTextColor={Colors.slate400}
              {...rest}
            />
          </View>
        ))}

        {/* AREA PICKER */}
        <Text style={s.inputLabel}>Area *</Text>
        <View style={s.areaGrid}>
          {AREAS.map(area => (
            <TouchableOpacity key={area} style={[s.areaChip, form.area === area && s.areaChipActive]}
              onPress={() => updateForm('area', area)}>
              <Text style={[s.areaChipText, form.area === area && s.areaChipTextActive]}>{area}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* GPS LOCATION */}
      <View style={s.card}>
        <Text style={s.cardTitle}>📍 Delivery Location</Text>
        <Text style={s.gpsDesc}>Allow location access to enable 60-minute express delivery.</Text>
        <TouchableOpacity style={[s.gpsBtn, locationStatus === 'checking' && { opacity: 0.7 }]} onPress={handleGetLocation} disabled={locationStatus === 'checking'}>
          {locationStatus === 'checking'
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.gpsBtnText}>
                {locationStatus === 'idle' ? '📡 Use My Location'
                  : locationStatus === 'allowed' ? '✓ Location Verified'
                  : locationStatus === 'blocked' ? '⚠️ Outside Delivery Zone'
                  : locationStatus === 'error' ? '⚠️ Try Again'
                  : '📡 Use My Location'}
              </Text>
          }
        </TouchableOpacity>
        {locationStatus === 'allowed' && deliveryInfo?.nearestStore && (
          <View style={s.deliveryConfirm}>
            <Text style={s.deliveryConfirmText}>✓ Delivery from {deliveryInfo.nearestStore.name}</Text>
          </View>
        )}
        {locationStatus === 'blocked' && (
          <View style={s.deliveryBlocked}>
            <Text style={s.deliveryBlockedText}>⚠️ {deliveryInfo?.message || 'Not in delivery zone'}</Text>
          </View>
        )}
      </View>

      {/* PAYMENT METHOD */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Payment Method</Text>
        {PAYMENT_METHODS.map(method => (
          <TouchableOpacity key={method} style={s.paymentOption} onPress={() => setPaymentMethod(method)}>
            <View style={[s.radio, paymentMethod === method && s.radioActive]} />
            <Text style={s.paymentLabel}>{method}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMsg ? <Text style={s.errorMsg}>{errorMsg}</Text> : null}

      <TouchableOpacity style={[s.placeOrderBtn, isSubmitting && { opacity: 0.7 }]} onPress={handlePlaceOrder} disabled={isSubmitting}>
        {isSubmitting
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={s.placeOrderText}>Place Order → WhatsApp Rs.{cartGrandTotal}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50 },
  content: { padding: 16, paddingBottom: 48 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.slate200 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: Colors.slate900, marginBottom: 14 },
  orderItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.slate100 },
  orderItemName: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.slate900 },
  orderItemDetail: { fontSize: 11, color: Colors.slate500, marginHorizontal: 8 },
  orderItemPrice: { fontSize: 13, fontWeight: '900', color: Colors.slate900 },
  divider: { height: 1, backgroundColor: Colors.slate200, marginVertical: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sumLabel: { fontSize: 13, color: Colors.slate500 },
  sumVal: { fontSize: 13, fontWeight: '700', color: Colors.slate900 },
  totalLabel: { fontSize: 16, fontWeight: '900', color: Colors.slate900 },
  totalVal: { fontSize: 18, fontWeight: '900', color: Colors.blue600 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: Colors.slate600, marginBottom: 5, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: Colors.slate50, borderRadius: 10, borderWidth: 1, borderColor: Colors.slate200, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: Colors.slate900 },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  areaChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: Colors.slate200, backgroundColor: Colors.slate50 },
  areaChipActive: { backgroundColor: Colors.slate900, borderColor: Colors.slate900 },
  areaChipText: { fontSize: 12, fontWeight: '700', color: Colors.slate600 },
  areaChipTextActive: { color: '#fff' },
  gpsDesc: { fontSize: 12, color: Colors.slate500, marginBottom: 12, lineHeight: 18 },
  gpsBtn: { backgroundColor: Colors.slate900, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  gpsBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  deliveryConfirm: { backgroundColor: Colors.emerald50, borderRadius: 10, padding: 10, marginTop: 10 },
  deliveryConfirmText: { fontSize: 12, fontWeight: '700', color: Colors.emerald600 },
  deliveryBlocked: { backgroundColor: Colors.rose50, borderRadius: 10, padding: 10, marginTop: 10 },
  deliveryBlockedText: { fontSize: 12, fontWeight: '700', color: Colors.rose500 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.slate100 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.slate300 },
  radioActive: { borderColor: Colors.slate900, backgroundColor: Colors.slate900 },
  paymentLabel: { fontSize: 14, fontWeight: '600', color: Colors.slate800 },
  errorMsg: { color: Colors.rose500, fontSize: 13, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  placeOrderBtn: { backgroundColor: '#25D366', borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginBottom: 8 },
  placeOrderText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
