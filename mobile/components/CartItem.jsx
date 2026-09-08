import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { resolveImageUrl } from '../config/api';

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const imgUri = resolveImageUrl(item.images?.front || item.image);

  return (
    <View style={s.card}>
      <Image source={{ uri: imgUri }} style={s.image} contentFit="cover" transition={200} />
      <View style={s.info}>
        <View style={s.topRow}>
          <Text style={s.name} numberOfLines={2}>{item.name}</Text>
          <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-outline" size={20} color={Colors.slate400} />
          </TouchableOpacity>
        </View>

        <View style={s.detailRow}>
          {item.selectedSize && (
            <View style={s.tag}><Text style={s.tagText}>Size: {item.selectedSize}</Text></View>
          )}
          {item.selectedColor && item.selectedColor !== 'Standard' && (
            <View style={s.tag}><Text style={s.tagText}>{item.selectedColor}</Text></View>
          )}
        </View>

        <View style={s.bottomRow}>
          <Text style={s.price}>Rs.{item.price * item.quantity}</Text>
          <View style={s.qtyRow}>
            <TouchableOpacity style={s.qtyBtn} onPress={onDecrease}>
              <Ionicons name="remove" size={14} color={Colors.slate700} />
            </TouchableOpacity>
            <Text style={s.qtyText}>{item.quantity}</Text>
            <TouchableOpacity style={s.qtyBtn} onPress={onIncrease}>
              <Ionicons name="add" size={14} color={Colors.slate700} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.slate200 },
  image: { width: 90, height: 120 },
  info: { flex: 1, padding: 12, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 13, fontWeight: '800', color: Colors.slate900, lineHeight: 18 },
  detailRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { backgroundColor: Colors.slate100, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: '700', color: Colors.slate600 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { fontSize: 16, fontWeight: '900', color: Colors.slate900 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.slate100, borderRadius: 10, padding: 2 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '900', color: Colors.slate900, width: 26, textAlign: 'center' },
});
