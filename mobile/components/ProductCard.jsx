import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { Colors } from '../constants/colors';
import { resolveImageUrl } from '../config/api';

const { width: SW } = Dimensions.get('window');

export default function ProductCard({ product, style }) {
  const { addToCart, toggleWishlist, isInWishlist, setSelectedProduct } = useShop();
  const [showBack, setShowBack] = useState(false);

  if (!product || !product.id) return null;

  const frontImg = resolveImageUrl(product.images?.front || product.image);
  const backImg = product.images?.back ? resolveImageUrl(product.images.back) : null;
  const currentImg = showBack && backImg ? backImg : frontImg;
  const inWishlist = isInWishlist(product.id || product._id);
  const defaultSize = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : 'M';

  const handlePress = () => {
    setSelectedProduct(product);
    router.push('/product/' + (product.id || product._id));
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <View style={[s.card, style]}>
      {/* IMAGE */}
      <TouchableOpacity style={s.imageBox} activeOpacity={0.95} onPress={handlePress}>
        <Image source={{ uri: currentImg }} style={s.image} contentFit="cover" transition={200} />

        {/* BADGES */}
        {product.badge && (
          <View style={s.badge}><Text style={s.badgeText}>{product.badge}</Text></View>
        )}
        {hasDiscount && (
          <View style={s.discountBadge}><Text style={s.discountText}>-{discountPct}%</Text></View>
        )}

        {/* FLIP TOGGLE */}
        {backImg && (
          <TouchableOpacity style={s.flipBtn} onPress={() => setShowBack(p => !p)}>
            <Text style={s.flipText}>{showBack ? 'Front' : 'Back'}</Text>
          </TouchableOpacity>
        )}

        {/* WISHLIST */}
        <TouchableOpacity
          style={s.heartBtn}
          onPress={() => toggleWishlist(product)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={18} color={inWishlist ? Colors.rose500 : Colors.slate600} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* INFO */}
      <View style={s.info}>
        {/* Store distance if available */}
        {product.distanceKm != null && (
          <View style={s.distRow}>
            <View style={s.distDot} />
            <Text style={s.distText}>{product.estimatedMinutes ?? Math.round(product.distanceKm * 8 + 8)} min delivery</Text>
          </View>
        )}

        <TouchableOpacity onPress={handlePress}>
          <Text style={s.name} numberOfLines={2}>{product.name}</Text>
        </TouchableOpacity>

        <View style={s.priceRow}>
          <View>
            <Text style={s.price}>Rs.{product.price}</Text>
            {hasDiscount && <Text style={s.origPrice}>Rs.{product.originalPrice}</Text>}
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => addToCart(product, defaultSize)}>
            <Ionicons name="add" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* SIZE CHIPS */}
        {product.sizes?.length > 0 && (
          <View style={s.sizes}>
            {product.sizes.slice(0, 4).map(sz => (
              <View key={sz} style={s.sizeTag}><Text style={s.sizeTagText}>{sz}</Text></View>
            ))}
            {product.sizes.length > 4 && (
              <Text style={s.sizeMore}>+{product.sizes.length - 4}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.slate200 },
  imageBox: { position: 'relative', aspectRatio: 3/4 },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.amber400, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 8, fontWeight: '900', color: Colors.slate900 },
  discountBadge: { position: 'absolute', top: 8, right: 36, backgroundColor: Colors.rose500, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontSize: 8, fontWeight: '900', color: '#ffffff' },
  flipBtn: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  flipText: { fontSize: 9, fontWeight: '900', color: Colors.slate700 },
  heartBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  info: { padding: 10 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  distDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.emerald600 },
  distText: { fontSize: 9, fontWeight: '700', color: Colors.emerald600 },
  name: { fontSize: 12, fontWeight: '800', color: Colors.slate900, lineHeight: 16, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  price: { fontSize: 14, fontWeight: '900', color: Colors.slate900 },
  origPrice: { fontSize: 10, fontWeight: '600', color: Colors.slate400, textDecorationLine: 'line-through' },
  addBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.slate900, alignItems: 'center', justifyContent: 'center' },
  sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  sizeTag: { backgroundColor: Colors.slate100, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  sizeTagText: { fontSize: 8, fontWeight: '700', color: Colors.slate600 },
  sizeMore: { fontSize: 8, fontWeight: '700', color: Colors.slate400, alignSelf: 'center' },
});
