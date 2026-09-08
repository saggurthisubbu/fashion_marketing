import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShop } from '../../context/ShopContext';
import { Colors } from '../../constants/colors';
import { resolveImageUrl } from '../../config/api';
import { formatQuickFitWhatsAppOrder } from '../../utils/whatsapp';

const { width: SW } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { products, selectedProduct, addToCart, buyNow, toggleWishlist, isInWishlist, showToast, verifiedLocation, userLocation } = useShop();

  const product = (selectedProduct?.id === id || selectedProduct?._id === id)
    ? selectedProduct
    : products.find(p => p.id === id || p._id === id);

  const [imgIdx, setImgIdx] = useState(0);
  const [selSize, setSelSize] = useState('M');
  const [selColor, setSelColor] = useState('');
  const flatRef = useRef(null);

  useEffect(() => {
    if (product) {
      setImgIdx(0);
      setSelSize(product.sizes?.[0] || 'M');
      setSelColor(product.colors?.[0]?.name || (typeof product.colors?.[0] === 'string' ? product.colors[0] : ''));
    }
  }, [product]);

  if (!product) {
    return (
      <View style={s.notFound}>
        <Text style={{ fontSize: 48 }}>not found</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const angles = [
    { key: 'front', url: resolveImageUrl(product.images?.front || product.image) },
    product.images?.back ? { key: 'back', url: resolveImageUrl(product.images.back) } : null,
    product.images?.left ? { key: 'left', url: resolveImageUrl(product.images.left) } : null,
    product.images?.right ? { key: 'right', url: resolveImageUrl(product.images.right) } : null,
  ].filter(Boolean);

  const inWishlist = isInWishlist(product.id || product._id);
  const loc = verifiedLocation || userLocation;
  const gpsLink = loc?.lat ? 'https://www.google.com/maps?q=' + loc.lat + ',' + loc.lng : 'Not provided';

  const handleAddToCart = () => {
    if (!selSize) { showToast('Please select a size.', 'warning'); return; }
    addToCart(product, selSize, selColor || 'Standard');
  };

  const handleBuyNow = () => {
    if (!selSize) { showToast('Please select a size.', 'warning'); return; }
    const ok = buyNow(product, selSize, selColor || 'Standard');
    if (ok) router.push('/checkout');
  };

  const handleWhatsApp = async () => {
    const url = formatQuickFitWhatsAppOrder({
      customerName: 'Valued Customer',
      productName: product.name,
      size: selSize,
      color: selColor,
      quantity: 1,
      price: product.price,
      imageUrl: '',
      address: '',
      locationLink: gpsLink,
    });
    try {
      await Linking.openURL(url);
    } catch (e) {
      showToast('Could not open WhatsApp.', 'error');
    }
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View>
        <FlatList
          ref={flatRef}
          data={angles}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.key}
          onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / SW))}
          renderItem={({ item }) => (
            <View style={{ width: SW, height: SW * 1.25 }}>
              <Image source={{ uri: item.url }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
            </View>
          )}
        />
        {angles.length > 1 && (
          <View style={s.dots}>
            {angles.map((_, i) => <View key={i} style={[s.dot, i === imgIdx && s.dotActive]} />)}
          </View>
        )}
        <TouchableOpacity style={s.wishBtn} onPress={() => toggleWishlist(product)}>
          <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={22} color={inWishlist ? Colors.rose500 : Colors.slate700} />
        </TouchableOpacity>
        {angles.length > 1 && (
          <View style={s.thumbs}>
            {angles.map((v, i) => (
              <TouchableOpacity key={v.key}
                style={[s.thumb, i === imgIdx && s.thumbActive]}
                onPress={() => { flatRef.current?.scrollToIndex({ index: i, animated: true }); setImgIdx(i); }}>
                <Image source={{ uri: v.url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={s.info}>
        <View style={s.topRow}>
          <Text style={s.sub}>{product.subcategory || product.category}</Text>
          {product.badge && <View style={s.badge}><Text style={s.badgeText}>{product.badge}</Text></View>}
        </View>
        <Text style={s.name}>{product.name}</Text>
        <View style={s.ratingRow}>
          <Text style={s.stars}>{'★'.repeat(Math.round(product.rating || 5))}</Text>
          <Text style={s.ratingTxt}>{product.rating || 4.9} ({product.reviewsCount || 24} reviews)</Text>
        </View>
        <View style={s.priceRow}>
          <Text style={s.price}>Rs.{product.price}</Text>
          {product.originalPrice && product.originalPrice > product.price &&
            <Text style={s.origPrice}>Rs.{product.originalPrice}</Text>}
        </View>

        <Text style={s.secLabel}>Size</Text>
        <View style={s.sizeRow}>
          {(product.sizes || ['S','M','L','XL','XXL']).map(sz => (
            <TouchableOpacity key={sz} style={[s.chip, selSize === sz && s.chipActive]} onPress={() => setSelSize(sz)}>
              <Text style={[s.chipTxt, selSize === sz && s.chipTxtActive]}>{sz}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {product.colors?.length > 0 && (
          <>
            <Text style={s.secLabel}>Color: <Text style={{ color: Colors.slate900, fontWeight: '900' }}>{selColor}</Text></Text>
            <View style={s.colorRow}>
              {product.colors.map(col => {
                const nm = typeof col === 'string' ? col : col.name || 'Standard';
                const hx = typeof col === 'string' ? '#000' : col.hex || '#000';
                return (
                  <TouchableOpacity key={nm} style={[s.swatch, selColor === nm && s.swatchActive]} onPress={() => setSelColor(nm)}>
                    <View style={[s.swatchCircle, { backgroundColor: hx }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {product.boutique && (
          <View style={s.storeRow}><Text>📍 </Text><Text style={s.storeTxt}>{product.boutique}</Text></View>
        )}
        {product.distanceKm != null && (
          <View style={s.storeRow}><Text>⚡ </Text><Text style={s.storeTxt}>{product.estimatedMinutes ?? Math.round(product.distanceKm * 8 + 8)} min delivery · {(+product.distanceKm).toFixed(1)} km away</Text></View>
        )}

        {product.description && (
          <>
            <Text style={s.secLabel}>Details</Text>
            <Text style={s.desc}>{product.description}</Text>
          </>
        )}

        <View style={s.ctaRow}>
          <TouchableOpacity style={s.cartBtn} onPress={handleAddToCart}>
            <Ionicons name="bag-outline" size={18} color="#fff" />
            <Text style={s.cartBtnTxt}>Add to Bag</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.buyBtn} onPress={handleBuyNow}>
            <Text style={s.buyBtnTxt}>Buy Now</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.waBtn} onPress={handleWhatsApp}>
          <Text style={{ fontSize: 18 }}>💬</Text>
          <Text style={s.waBtnTxt}>Quick Order via WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  backBtn: { backgroundColor: Colors.slate900, borderRadius: 100, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontWeight: '900' },
  dots: { position: 'absolute', bottom: 68, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 20, backgroundColor: '#fff' },
  wishBtn: { position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  thumbs: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', gap: 6 },
  thumb: { width: 44, height: 56, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  thumbActive: { borderColor: '#fff' },
  info: { padding: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sub: { fontSize: 11, fontWeight: '700', color: Colors.slate400, textTransform: 'uppercase', letterSpacing: 1 },
  badge: { backgroundColor: Colors.amber400, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '900', color: Colors.slate900 },
  name: { fontSize: 22, fontWeight: '900', color: Colors.slate900, letterSpacing: -0.5, lineHeight: 28, marginBottom: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  stars: { color: Colors.amber400, fontSize: 14, letterSpacing: 2 },
  ratingTxt: { fontSize: 12, color: Colors.slate500 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  price: { fontSize: 28, fontWeight: '900', color: Colors.slate900 },
  origPrice: { fontSize: 15, fontWeight: '700', color: Colors.slate400, textDecorationLine: 'line-through' },
  secLabel: { fontSize: 12, fontWeight: '900', color: Colors.slate700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 14 },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1.5, borderColor: Colors.slate200 },
  chipActive: { backgroundColor: Colors.slate900, borderColor: Colors.slate900 },
  chipTxt: { fontSize: 13, fontWeight: '700', color: Colors.slate700 },
  chipTxtActive: { color: '#fff' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18, padding: 2, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: Colors.slate900 },
  swatchCircle: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: Colors.slate200 },
  storeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  storeTxt: { fontSize: 12, color: Colors.slate600, fontWeight: '600' },
  desc: { fontSize: 13, color: Colors.slate600, lineHeight: 20 },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cartBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.slate900, borderRadius: 14, paddingVertical: 14 },
  cartBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  buyBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.blue600, borderRadius: 14, paddingVertical: 14 },
  buyBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 12, marginBottom: 16 },
  waBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 13 },
});