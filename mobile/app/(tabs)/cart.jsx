import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useShop } from '../../context/ShopContext';
import CartItem from '../../components/CartItem';
import { Colors } from '../../constants/colors';

export default function CartScreen() {
  const {
    cart, updateQuantity, removeFromCart,
    cartSubtotal, discountAmount, deliveryFee, cartGrandTotal,
    promoCode, setPromoCode, appliedPromo, promoError, applyPromoCode, removePromo,
  } = useShop();

  const safeCart = cart.filter(item => item && item.id && item.name && typeof item.price === 'number');

  if (safeCart.length === 0) {
    return (
      <View style={s.emptyContainer}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>🛍️</Text>
        <Text style={s.emptyTitle}>Your Bag Is Empty</Text>
        <Text style={s.emptyDesc}>Add items from the catalog to enjoy 60-minute express delivery!</Text>
        <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/catalog')}>
          <Text style={s.shopBtnText}>Browse Collection →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={safeCart}
        keyExtractor={(item, idx) => `${item.id}-${item.selectedSize}-${item.selectedColor}-${idx}`}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onIncrease={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, 1)}
            onDecrease={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, -1)}
            onRemove={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
          />
        )}
        ListFooterComponent={
          <View style={s.footer}>
            {/* PROMO CODE */}
            <View style={s.promoSection}>
              <View style={s.promoRow}>
                <Text style={s.promoLabel}>Promo Code</Text>
                <Text style={s.promoHint}>Try: QUICK60 | FIRSTFIT</Text>
              </View>
              {appliedPromo ? (
                <View style={s.promoApplied}>
                  <Text style={s.promoAppliedText}>✓ {appliedPromo.code} — Rs.{discountAmount} off</Text>
                  <TouchableOpacity onPress={removePromo}>
                    <Text style={s.promoRemove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.promoInputRow}>
                  <TextInput
                    style={s.promoInput}
                    value={promoCode}
                    onChangeText={setPromoCode}
                    placeholder="Enter code (e.g. QUICK60)"
                    placeholderTextColor={Colors.slate400}
                    autoCapitalize="characters"
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={s.applyBtn} onPress={applyPromoCode}>
                    <Text style={s.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              )}
              {promoError ? <Text style={s.promoError}>{promoError}</Text> : null}
            </View>

            {/* PRICE BREAKDOWN */}
            <View style={s.breakdown}>
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>Subtotal</Text>
                <Text style={s.breakdownValue}>Rs.{cartSubtotal}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={s.breakdownRow}>
                  <Text style={[s.breakdownLabel, { color: Colors.emerald600 }]}>Promo Discount</Text>
                  <Text style={[s.breakdownValue, { color: Colors.emerald600, fontWeight: '900' }]}>-Rs.{discountAmount}</Text>
                </View>
              )}
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>60-Min Express Delivery</Text>
                {deliveryFee === 0 ? (
                  <Text style={[s.breakdownValue, { color: Colors.emerald600, fontWeight: '900' }]}>FREE</Text>
                ) : (
                  <Text style={s.breakdownValue}>Rs.{deliveryFee}</Text>
                )}
              </View>
              <View style={[s.breakdownRow, s.totalRow]}>
                <Text style={s.totalLabel}>Grand Total</Text>
                <Text style={s.totalValue}>Rs.{cartGrandTotal}</Text>
              </View>
            </View>

            {/* CHECKOUT BUTTON */}
            <TouchableOpacity style={s.checkoutBtn} onPress={() => router.push('/checkout')}>
              <Text style={s.checkoutBtnText}>Proceed to Checkout →</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.slate50 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.slate900, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: Colors.slate500, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  shopBtn: { backgroundColor: Colors.slate900, borderRadius: 100, paddingHorizontal: 28, paddingVertical: 14, marginTop: 24 },
  shopBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  footer: { marginTop: 8 },
  promoSection: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.slate200 },
  promoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  promoLabel: { fontSize: 12, fontWeight: '900', color: Colors.slate700 },
  promoHint: { fontSize: 10, fontWeight: '700', color: Colors.blue600 },
  promoInputRow: { flexDirection: 'row', gap: 8 },
  promoInput: { flex: 1, backgroundColor: Colors.slate50, borderRadius: 10, borderWidth: 1, borderColor: Colors.slate200, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, fontWeight: '700', color: Colors.slate900, textTransform: 'uppercase' },
  applyBtn: { backgroundColor: Colors.slate900, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  applyBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },
  promoApplied: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.emerald50, borderRadius: 10, padding: 10 },
  promoAppliedText: { fontSize: 12, fontWeight: '700', color: Colors.emerald600 },
  promoRemove: { fontSize: 12, fontWeight: '700', color: Colors.rose500 },
  promoError: { fontSize: 12, color: Colors.rose500, marginTop: 6 },
  breakdown: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.slate200 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakdownLabel: { fontSize: 13, color: Colors.slate600 },
  breakdownValue: { fontSize: 13, fontWeight: '700', color: Colors.slate900 },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.slate200, marginTop: 6, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: '900', color: Colors.slate900 },
  totalValue: { fontSize: 18, fontWeight: '900', color: Colors.blue600 },
  checkoutBtn: { backgroundColor: Colors.blue600, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginBottom: 12 },
  checkoutBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 },
});
