import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Dimensions, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShop } from '../../context/ShopContext';
import ProductCard from '../../components/ProductCard';
import LocationBanner from '../../components/LocationBanner';
import AdminModal from '../../components/AdminModal';
import { Colors } from '../../constants/colors';
import { resolveImageUrl } from '../../config/api';

const { width: SW } = Dimensions.get('window');

const FALLBACK_CATS = [
  { id: '1', name: 'Oversized T-Shirts', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop' },
  { id: '2', name: 'Drop Shoulder T-Shirts', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop' },
  { id: '3', name: 'Polo T-Shirts', image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=800&auto=format&fit=crop' },
  { id: '4', name: 'Shirts', image: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=800&auto=format&fit=crop' },
];

export default function HomeScreen() {
  const { products, isLoadingProducts, categories, setSelectedCategory, user, isAdminOpen, setIsAdminOpen } = useShop();

  const featuredProduct = products.length > 0 ? products[0] : null;
  const heroImageUri = resolveImageUrl(
    featuredProduct?.images?.front || featuredProduct?.image ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'
  );

  const activeCats = categories.filter(c => c.isActive !== false);
  const displayCats = activeCats.length > 0
    ? activeCats.map(c => ({ id: c._id || c.name, name: c.name, image: resolveImageUrl(c.image) }))
    : FALLBACK_CATS;

  const isAdmin = user?.role === 'admin' || user?.role === 'store_owner';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.logoIcon}><Text style={{ fontSize: 16 }}>⚡</Text></View>
            <Text style={s.logoText}>QUICKFIT</Text>
            <View style={s.mensBadge}><Text style={s.mensBadgeText}>MEN</Text></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {isAdmin && (
              <TouchableOpacity style={s.adminBtn} onPress={() => setIsAdminOpen(true)}>
                <Text style={s.adminBtnText}>⚡ Admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.searchBtn} onPress={() => router.push('/catalog')}>
              <Ionicons name="search-outline" size={20} color={Colors.slate700} />
            </TouchableOpacity>
          </View>
        </View>

        <LocationBanner />

        {/* HERO */}
        <TouchableOpacity style={s.heroCard} activeOpacity={0.95}
          onPress={() => featuredProduct && router.push(`/product/${featuredProduct.id}`)}>
          <Image source={{ uri: heroImageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
          <View style={s.heroOverlay} />
          <View style={s.heroBadge}>
            <View style={s.heroDot} />
            <Text style={s.heroBadgeText}>QUICKFIT MEN'S STREETWEAR</Text>
          </View>
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>PREMIUM{'\n'}MEN'S FASHION.</Text>
            <View style={s.heroProductCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.heroSub}>{featuredProduct?.subcategory || 'Heavy French Terry'}</Text>
                <Text style={s.heroName} numberOfLines={1}>{featuredProduct?.name || 'Monochrome Boxy Oversized Tee'}</Text>
              </View>
              <Text style={s.heroPrice}>Rs.{featuredProduct?.price || 1499}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* SPECS */}
        <View style={s.specsRow}>
          {[['240+GSM','Heavy Cotton'],['BOXY','Modern Drape'],['EXPRESS','Vijayawada']].map(([v,l]) => (
            <View key={v} style={s.specItem}>
              <Text style={s.specVal}>{v}</Text>
              <Text style={s.specLbl}>{l}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <TouchableOpacity style={s.ctaBtn} onPress={() => { setSelectedCategory('All'); router.push('/catalog'); }}>
            <Text style={s.ctaText}>Shop Collection →</Text>
          </TouchableOpacity>
        </View>

        {/* CATEGORIES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Shop by Collection</Text>
          <FlatList data={displayCats} horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={i => i.id}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.catCard} activeOpacity={0.9}
                onPress={() => { setSelectedCategory(item.name); router.push('/catalog'); }}>
                <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
                <View style={s.catOverlay} />
                <Text style={s.catName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* FEATURED PRODUCTS */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Featured Styles</Text>
            <TouchableOpacity onPress={() => router.push('/catalog')}>
              <Text style={s.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {isLoadingProducts ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 24 }}>
              <ActivityIndicator size="small" color={Colors.slate900} />
              <Text style={{ fontSize: 13, color: Colors.slate500 }}>Loading products...</Text>
            </View>
          ) : (
            <FlatList data={products.slice(0, 8)} horizontal showsHorizontalScrollIndicator={false}
              keyExtractor={i => i.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => (
                <View style={{ width: SW * 0.42 }}><ProductCard product={item} /></View>
              )}
            />
          )}
        </View>

        {/* FEATURES */}
        <View style={[s.section, { paddingHorizontal: 16, marginBottom: 32 }]}>
          <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Why QuickFit?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[['⚡','60-Min Express','Vijayawada fastest delivery'],['🎯','240+ GSM Cotton','Premium heavyweight fabric'],['📦','Free Delivery','On orders above Rs.999'],['↩️','Easy Returns','7-day hassle-free returns']].map(([icon, title, desc]) => (
              <View key={title} style={s.featureCard}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{icon}</Text>
                <Text style={s.featureTitle}>{title}</Text>
                <Text style={s.featureDesc}>{desc}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
      <AdminModal visible={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, backgroundColor: Colors.slate50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: Colors.slate200 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.slate900, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 20, fontWeight: '900', color: Colors.slate900, letterSpacing: -0.5 },
  mensBadge: { backgroundColor: Colors.slate900, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  mensBadgeText: { color: '#ffffff', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  adminBtn: { backgroundColor: Colors.amber400, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  adminBtnText: { fontSize: 11, fontWeight: '900', color: Colors.slate900 },
  searchBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.slate100, alignItems: 'center', justifyContent: 'center' },
  heroCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden', height: 420 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  heroDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.orange500 },
  heroBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroTitle: { color: '#ffffff', fontSize: 30, fontWeight: '900', letterSpacing: -1, lineHeight: 33, marginBottom: 14 },
  heroProductCard: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroSub: { fontSize: 9, fontWeight: '900', color: Colors.orange600, textTransform: 'uppercase', letterSpacing: 1 },
  heroName: { fontSize: 12, fontWeight: '900', color: Colors.slate900, marginTop: 2 },
  heroPrice: { fontSize: 16, fontWeight: '900', color: Colors.slate900 },
  specsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: Colors.slate200, overflow: 'hidden' },
  specItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.slate100 },
  specVal: { fontSize: 15, fontWeight: '900', color: Colors.slate900 },
  specLbl: { fontSize: 9, fontWeight: '700', color: Colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  ctaBtn: { backgroundColor: Colors.slate900, borderRadius: 100, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#ffffff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  section: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.slate900, letterSpacing: -0.5, paddingHorizontal: 16 },
  seeAll: { fontSize: 12, fontWeight: '700', color: Colors.blue600 },
  catCard: { width: 140, height: 190, borderRadius: 16, overflow: 'hidden' },
  catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.38)' },
  catName: { position: 'absolute', bottom: 12, left: 10, right: 10, color: '#ffffff', fontSize: 12, fontWeight: '900', lineHeight: 15 },
  featureCard: { width: '47.5%', backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.slate200 },
  featureTitle: { fontSize: 12, fontWeight: '900', color: Colors.slate900, marginBottom: 3 },
  featureDesc: { fontSize: 11, color: Colors.slate500, lineHeight: 15 },
});
