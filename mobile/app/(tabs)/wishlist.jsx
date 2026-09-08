import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useShop } from '../../context/ShopContext';
import { Colors } from '../../constants/colors';
import { resolveImageUrl } from '../../config/api';

export default function WishlistScreen() {
  const { wishlist, toggleWishlist, addToCart } = useShop();

  if (wishlist.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={{ fontSize: 56 }}>❤️</Text>
        <Text style={s.emptyTitle}>No Saved Items</Text>
        <Text style={s.emptyDesc}>Tap the heart on any product to save it here.</Text>
        <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/catalog')}>
          <Text style={s.browseBtnText}>Browse Collection →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={wishlist}
        numColumns={2}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={s.grid}
        columnWrapperStyle={{ gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const img = resolveImageUrl(item.images?.front || item.image);
          const defaultSize = Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes[0] : 'M';
          return (
            <TouchableOpacity style={s.card} activeOpacity={0.9}
              onPress={() => { router.push(`/product/${item.id || item._id}`); }}>
              <View style={s.imageContainer}>
                <Image source={{ uri: img }} style={s.image} contentFit="cover" transition={300} />
                <TouchableOpacity style={s.heartBtn} onPress={() => toggleWishlist(item)}>
                  <Text style={{ fontSize: 16, color: Colors.rose500 }}>♥</Text>
                </TouchableOpacity>
              </View>
              <View style={s.info}>
                <Text style={s.name} numberOfLines={2}>{item.name}</Text>
                <View style={s.priceRow}>
                  <Text style={s.price}>Rs.{item.price}</Text>
                  <TouchableOpacity style={s.addBtn} onPress={() => addToCart(item, defaultSize)}>
                    <Text style={s.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50 },
  grid: { padding: 12, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8, backgroundColor: Colors.slate50 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.slate900 },
  emptyDesc: { fontSize: 13, color: Colors.slate500, textAlign: 'center', lineHeight: 20 },
  browseBtn: { backgroundColor: Colors.slate900, borderRadius: 100, paddingHorizontal: 28, paddingVertical: 14, marginTop: 16 },
  browseBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  card: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.slate200 },
  imageContainer: { position: 'relative', aspectRatio: 3/4 },
  image: { width: '100%', height: '100%' },
  heartBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  info: { padding: 10 },
  name: { fontSize: 12, fontWeight: '800', color: Colors.slate900, lineHeight: 16, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 14, fontWeight: '900', color: Colors.slate900 },
  addBtn: { backgroundColor: Colors.slate900, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  addBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
});
