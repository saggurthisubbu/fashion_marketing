import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { useShop } from '../../context/ShopContext';
import { Colors } from '../../constants/colors';

const WEB_ADMIN_URL = 'https://quickfit-menswear.vercel.app/admin';

export default function AccountScreen() {
  const { user, loginUser, logoutUser, isAdminOpen, setIsAdminOpen, API_BASE_URL, showToast } = useShop();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const isAdmin = user?.role === 'admin' || user?.role === 'store_owner';

  const handleLogin = async () => {
    if (!form.email || !form.password) { setErrorMsg('Please fill all fields.'); return; }
    setLoading(true); setErrorMsg('');
    try {
      await loginUser(form.email.trim(), form.password);
      setForm({ name: '', email: '', password: '', phone: '' });
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone) { setErrorMsg('Please fill all fields.'); return; }
    setLoading(true); setErrorMsg('');
    try {
      const axios = require('axios');
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: form.name.trim(), email: form.email.trim(),
        password: form.password, phone: form.phone.trim(),
        role: 'customer',
      });
      await loginUser(form.email.trim(), form.password);
      setForm({ name: '', email: '', password: '', phone: '' });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logoutUser },
    ]);
  };

  // ── LOGGED IN VIEW ───────────────────────────────────────────────────────
  if (user) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
        <View style={s.profileCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <Text style={s.profileName}>{user.name}</Text>
          <Text style={s.profileEmail}>{user.email}</Text>
          <View style={[s.roleBadge, isAdmin && s.roleBadgeAdmin]}>
            <Text style={[s.roleText, isAdmin && s.roleTextAdmin]}>{user.role?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Phone</Text>
          <Text style={s.infoValue}>{user.phone || 'Not provided'}</Text>
          <View style={s.divider} />
          <Text style={s.infoLabel}>Account Type</Text>
          <Text style={s.infoValue}>{user.role === 'admin' ? 'System Administrator' : user.role === 'store_owner' ? 'Store Owner' : 'Customer'}</Text>
        </View>

        {isAdmin && (
          <View style={s.adminSection}>
            <Text style={s.adminSectionTitle}>⚡ Admin Access</Text>
            <Text style={s.adminSectionDesc}>You have {user.role === 'store_owner' ? 'store owner' : 'admin'} privileges.</Text>
            <TouchableOpacity style={s.adminOpenBtn} onPress={() => setIsAdminOpen(true)}>
              <Text style={s.adminOpenBtnText}>Open Admin Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.webAdminBtn} onPress={() => Linking.openURL(WEB_ADMIN_URL).catch(() => {})}>
              <Text style={s.webAdminBtnText}>🌐 Open Full Dashboard in Browser</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.menuSection}>
          {[
            { icon: '📦', label: 'My Orders' },
            { icon: '📍', label: 'Delivery Address' },
            { icon: '🔔', label: 'Notifications' },
            { icon: '❓', label: 'Help & Support' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={s.menuItem}>
              <Text style={s.menuIcon}>{item.icon}</Text>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.signOutBtn} onPress={handleLogout}>
          <Text style={s.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── AUTH FORM ────────────────────────────────────────────────────────────
  return (
    <ScrollView style={s.container} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={s.authHeader}>
        <Text style={s.authTitle}>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
        <Text style={s.authSubtitle}>{mode === 'login' ? 'Sign in to your QuickFit account' : 'Join QuickFit Menswear'}</Text>
      </View>

      <View style={s.formCard}>
        {mode === 'register' && (
          <>
            <Text style={s.inputLabel}>Full Name</Text>
            <TextInput style={s.input} value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Your full name" placeholderTextColor={Colors.slate400} autoCapitalize="words" />
            <Text style={s.inputLabel}>Phone Number</Text>
            <TextInput style={s.input} value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder="+91 XXXXX XXXXX" placeholderTextColor={Colors.slate400} keyboardType="phone-pad" />
          </>
        )}
        <Text style={s.inputLabel}>Email Address</Text>
        <TextInput style={s.input} value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} placeholder="you@example.com" placeholderTextColor={Colors.slate400} keyboardType="email-address" autoCapitalize="none" />
        <Text style={s.inputLabel}>Password</Text>
        <TextInput style={s.input} value={form.password} onChangeText={v => setForm(p => ({ ...p, password: v }))} placeholder="••••••••" placeholderTextColor={Colors.slate400} secureTextEntry />

        {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}

        <TouchableOpacity style={s.submitBtn} onPress={mode === 'login' ? handleLogin : handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={s.submitBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.switchMode} onPress={() => { setMode(m => m === 'login' ? 'register' : 'login'); setErrorMsg(''); }}>
          <Text style={s.switchModeText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={{ color: Colors.blue600, fontWeight: '900' }}>{mode === 'login' ? 'Register' : 'Sign In'}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={s.guestNote}>
        <Text style={s.guestNoteText}>You can browse and order as a guest. Sign in to save your order history.</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  profileCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.slate200, marginBottom: 14 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.slate900, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 30, fontWeight: '900', color: '#ffffff' },
  profileName: { fontSize: 20, fontWeight: '900', color: Colors.slate900, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: Colors.slate500, marginBottom: 12 },
  roleBadge: { backgroundColor: Colors.slate200, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4 },
  roleBadgeAdmin: { backgroundColor: Colors.amber400 },
  roleText: { fontSize: 10, fontWeight: '900', color: Colors.slate700, letterSpacing: 1 },
  roleTextAdmin: { color: Colors.slate900 },
  infoCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.slate200, marginBottom: 14 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: Colors.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '700', color: Colors.slate900, marginBottom: 12 },
  divider: { height: 1, backgroundColor: Colors.slate100, marginBottom: 12 },
  adminSection: { backgroundColor: Colors.amber50, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.amber400, marginBottom: 14 },
  adminSectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.slate900, marginBottom: 4 },
  adminSectionDesc: { fontSize: 12, color: Colors.slate600, marginBottom: 12 },
  adminOpenBtn: { backgroundColor: Colors.slate900, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  adminOpenBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  webAdminBtn: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.slate200 },
  webAdminBtnText: { color: Colors.slate700, fontWeight: '700', fontSize: 12 },
  menuSection: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: Colors.slate200, overflow: 'hidden', marginBottom: 14 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.slate100 },
  menuIcon: { fontSize: 18, width: 32 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.slate800 },
  menuArrow: { fontSize: 20, color: Colors.slate400 },
  signOutBtn: { borderWidth: 1, borderColor: Colors.rose500, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  signOutBtnText: { color: Colors.rose500, fontWeight: '900', fontSize: 15 },
  authHeader: { paddingVertical: 24, alignItems: 'center' },
  authTitle: { fontSize: 26, fontWeight: '900', color: Colors.slate900, marginBottom: 6 },
  authSubtitle: { fontSize: 13, color: Colors.slate500 },
  formCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.slate200, marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.slate700, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.slate50, borderRadius: 12, borderWidth: 1, borderColor: Colors.slate200, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.slate900 },
  errorText: { color: Colors.rose500, fontSize: 12, fontWeight: '600', marginTop: 10 },
  submitBtn: { backgroundColor: Colors.slate900, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  switchMode: { alignItems: 'center', paddingVertical: 14 },
  switchModeText: { fontSize: 13, color: Colors.slate500 },
  guestNote: { backgroundColor: Colors.slate100, borderRadius: 12, padding: 14 },
  guestNoteText: { fontSize: 12, color: Colors.slate500, textAlign: 'center', lineHeight: 18 },
});
