import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShop } from '../../context/ShopContext';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/colors';

const CATEGORIES = [
  { label: 'All', slug: 'All' },
  { label: 'Oversized', slug: 'Oversized T-Shirts' },
  { label: 'Drop Shoulder', slug: 'Drop Shoulder T-Shirts' },
  { label: 'Polo', slug: 'Polo T-Shirts' },
  { label: 'Shirts', slug: 'Shirts' },
];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low', value: 'price_asc' },
  { label: 'Price: High', value: 'price_desc' },
  { label: 'Rating', value: 'rating' },
];

export default function CatalogScreen() {
  const { products, isLoadingProducts, productsError, fetchProducts, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, sortBy, setSortBy } = useShop();
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    let list = [...products];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'All') {
      const target = selectedCategory.trim().toLowerCase();
      list = list.filter(p => {
        const sub = (p.subcategory || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        if (target === 'shirts') return (sub === 'shirts' || sub === 'linen shirts' || sub === 'formal shirts') && !sub.includes('t-shirt');
        if (target.includes('oversized')) return sub.includes('oversized') || name.includes('oversized');
        if (target.includes('drop shoulder')) return sub.includes('drop shoulder') || name.includes('drop shoulder');
        if (target.includes('polo')) return sub.includes('polo') || name.includes('polo');
        return sub.includes(target) || cat.includes(target);
      });
    }
    if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  return (
    <View style={s.container}>
      {/* SEARCH BAR */}
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.slate400} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search oversized, polo, shirts..."
          placeholderTextColor={Colors.slate400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.slate400} />
          </TouchableOpacity>
        )}
      </View>

      {/* CATEGORY PILLS */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.slug}
        contentContainerStyle={s.pills}
        renderItem={({ item }) => {
          const active = selectedCategory === item.slug;
          return (
            <TouchableOpacity
              style={[s.pill, active && s.pillActive]}
              onPress={() => setSelectedCategory(item.slug)}
            >
              <Text style={[s.pillText, active && s.pillTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* SORT + COUNT ROW */}
      <View style={s.sortRow}>
        <Text style={s.countText}>{filtered.length} products</Text>
        <TouchableOpacity style={s.sortBtn} onPress={() => setShowSort(!showSort)}>
          <Ionicons name="funnel-outline" size={14} color={Colors.slate700} />
          <Text style={s.sortBtnText}>{SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}</Text>
          <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.slate500} />
        </TouchableOpacity>
      </View>

      {/* SORT DROPDOWN */}
      {showSort && (
        <View style={s.sortDropdown}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.value} style={[s.sortOption, sortBy === opt.value && s.sortOptionActive]}
              onPress={() => { setSortBy(opt.value); setShowSort(false); }}>
              <Text style={[s.sortOptionText, sortBy === opt.value && { color: Colors.slate900, fontWeight: '900' }]}>{opt.label}</Text>
              {sortBy === opt.value && <Ionicons name="checkmark" size={14} color={Colors.slate900} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* PRODUCT GRID */}
      {isLoadingProducts ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.slate900} />
          <Text style={s.loadingText}>Loading products...</Text>
        </View>
      ) : productsError ? (
        <View style={s.center}>
          <Text style={s.errorIcon}>⚠️</Text>
          <Text style={s.errorText}>{productsError}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => fetchProducts(null)}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 36 }}>🔍</Text>
          <Text style={s.emptyText}>No products found</Text>
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
            <Text style={{ color: Colors.blue600, fontWeight: '700', marginTop: 8 }}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={item => item.id}
          contentContainerStyle={s.grid}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard product={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50 },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: Colors.slate200, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 13, color: Colors.slate900, fontWeight: '500' },
  pills: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#ffffff', borderWidth: 1, borderColor: Colors.slate200 },
  pillActive: { backgroundColor: Colors.slate900, borderColor: Colors.slate900 },
  pillText: { fontSize: 12, fontWeight: '700', color: Colors.slate600 },
  pillTextActive: { color: '#ffffff' },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 },
  countText: { fontSize: 12, color: Colors.slate500, fontWeight: '600' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: Colors.slate200 },
  sortBtnText: { fontSize: 12, fontWeight: '700', color: Colors.slate700 },
  sortDropdown: { marginHorizontal: 14, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: Colors.slate200, overflow: 'hidden', marginBottom: 6 },
  sortOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.slate100 },
  sortOptionActive: { backgroundColor: Colors.slate50 },
  sortOptionText: { fontSize: 13, color: Colors.slate600, fontWeight: '600' },
  grid: { padding: 12, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 14, color: Colors.slate500, marginTop: 8 },
  errorIcon: { fontSize: 32 },
  errorText: { fontSize: 13, color: Colors.slate600, textAlign: 'center', lineHeight: 20 },
  retryBtn: { backgroundColor: Colors.slate900, borderRadius: 100, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  retryText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  emptyText: { fontSize: 15, fontWeight: '700', color: Colors.slate700 },
});
