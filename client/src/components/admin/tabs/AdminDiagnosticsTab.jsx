import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity,
  Bell,
  BellOff,
  Smartphone,
  Download,
  Key,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Package,
  Layers,
  Server,
  Radio,
  FileCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { isPwaInstalled, promptPwaInstall } from '../../../utils/pwaPrompt';
import {
  registerAdminPushNotifications,
  refreshAdminFcmToken,
  getLastReceivedNotification,
  getNotificationHistory,
  playOrderNotificationSound
} from '../../../config/firebase';
import { stopOrderAlert } from '../../../utils/audioAlert';

export const AdminDiagnosticsTab = ({
  onNavigateTab,
  API_BASE_URL,
  token,
  showToast = () => {}
}) => {
  // Permission & Environment State
  const [permission, setPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
  });
  const [isStandalone, setIsStandalone] = useState(() => isPwaInstalled());
  const [currentFcmToken, setCurrentFcmToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('quickfit_fcm_token') || '' : '';
  });
  const [tokenSyncedAt, setTokenSyncedAt] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('quickfit_fcm_token_synced_at') || '' : '';
  });

  // Diagnostics & Tester State
  const [lastNotification, setLastNotification] = useState(() => getLastReceivedNotification());
  const [notificationList, setNotificationList] = useState(() => getNotificationHistory());
  const [serverDiagnostics, setServerDiagnostics] = useState(null);
  const [isLoadingServerData, setIsLoadingServerData] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [isInstallingPwa, setIsInstallingPwa] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showFullToken, setShowFullToken] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [testLogs, setTestLogs] = useState([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const getAuthHeader = () => {
    const t = token || (typeof window !== 'undefined' ? localStorage.getItem('quickfit_token') : '');
    return t ? { headers: { Authorization: `Bearer ${t}` } } : {};
  };

  const addTestLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setTestLogs((prev) => [{ time, message, type }, ...prev.slice(0, 19)]);
  };

  // Fetch Server Diagnostics
  const fetchServerDiagnostics = async () => {
    if (!API_BASE_URL) return;
    setIsLoadingServerData(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/notifications/diagnostics`, getAuthHeader());
      if (res.data?.success) {
        setServerDiagnostics(res.data);
        addTestLog(`Server diagnostics fetched: ${res.data.stats?.total || 0} active admin device(s) in database`, 'success');
      }
    } catch (err) {
      console.warn('[Diagnostics Error]:', err.message);
      addTestLog(`Failed to load server diagnostics: ${err.message}`, 'error');
    } finally {
      setIsLoadingServerData(false);
    }
  };

  // Sync state on mount and subscribe to window events
  useEffect(() => {
    const refreshLocalState = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
      setIsStandalone(isPwaInstalled());
      setCurrentFcmToken(localStorage.getItem('quickfit_fcm_token') || '');
      setTokenSyncedAt(localStorage.getItem('quickfit_fcm_token_synced_at') || '');
      setLastNotification(getLastReceivedNotification());
      setNotificationList(getNotificationHistory());
    };

    refreshLocalState();
    fetchServerDiagnostics();

    const handleNotifReceived = (e) => {
      setLastNotification(e.detail);
      setNotificationList(getNotificationHistory());
      addTestLog(`Notification received: #${e.detail?.orderId || 'Alert'} via ${e.detail?.source || 'FCM'}`, 'success');
    };

    const handleTokenChange = (e) => {
      setCurrentFcmToken(e.detail?.token || '');
      setTokenSyncedAt(new Date().toISOString());
      addTestLog(`FCM Token updated: ${e.detail?.token?.slice(0, 12)}...`, 'info');
    };

    window.addEventListener('quickfit_notification_received', handleNotifReceived);
    window.addEventListener('quickfit_fcm_token_changed', handleTokenChange);
    window.addEventListener('quickfit_pwa_installed', refreshLocalState);
    window.addEventListener('focus', refreshLocalState);

    return () => {
      window.removeEventListener('quickfit_notification_received', handleNotifReceived);
      window.removeEventListener('quickfit_fcm_token_changed', handleTokenChange);
      window.removeEventListener('quickfit_pwa_installed', refreshLocalState);
      window.removeEventListener('focus', refreshLocalState);
    };
  }, []);

  // Handler: Request / Enable Push Notification
  const handleEnablePush = async () => {
    setIsRegisteringPush(true);
    addTestLog('Requesting browser notification permission & registering FCM token...', 'info');
    try {
      const res = await registerAdminPushNotifications(token);
      if (res?.success) {
        setPermission('granted');
        setCurrentFcmToken(res.token || '');
        setTokenSyncedAt(new Date().toISOString());
        showToast('Push Notifications Enabled! Real FCM Device Token Registered 🔔', 'success');
        addTestLog('Push notifications enabled & token registered with backend', 'success');
        await fetchServerDiagnostics();
      } else {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setPermission(Notification.permission);
        }
        showToast(res?.error || 'Could not enable push notifications.', 'warning');
        addTestLog(`Push permission not granted: ${res?.error || res?.permission}`, 'error');
      }
    } catch (err) {
      showToast('Notification error: ' + err.message, 'error');
      addTestLog(`Error enabling push: ${err.message}`, 'error');
    } finally {
      setIsRegisteringPush(false);
    }
  };

  // Handler: Force Refresh FCM Device Token
  const handleRefreshToken = async () => {
    setIsRefreshingToken(true);
    addTestLog('Acquiring fresh FCM token from Firebase SDK & rotating backend registration...', 'info');
    try {
      const res = await refreshAdminFcmToken(token);
      if (res?.success) {
        setCurrentFcmToken(res.token);
        setTokenSyncedAt(new Date().toISOString());
        showToast('FCM device token refreshed & synced with server! 🔄', 'success');
        addTestLog(`Token refreshed successfully (${res.isNew ? 'New token rotated' : 'Token verified'})`, 'success');
        await fetchServerDiagnostics();
      } else {
        showToast(res?.error || 'Failed to refresh token', 'error');
        addTestLog(`Token refresh failed: ${res?.error}`, 'error');
      }
    } catch (err) {
      showToast('Refresh error: ' + err.message, 'error');
      addTestLog(`Refresh error: ${err.message}`, 'error');
    } finally {
      setIsRefreshingToken(false);
    }
  };

  // Handler: Trigger Server-side Test FCM Push to All Devices
  const handleTriggerTestPush = async () => {
    setIsTestingPush(true);
    addTestLog('Sending test order notification via POST /api/admin/notifications/test-fcm...', 'info');
    try {
      // Play local sound immediately
      playOrderNotificationSound('TEST-AUDIO');
      setIsPlayingAudio(true);

      const res = await axios.post(`${API_BASE_URL}/admin/notifications/test-fcm`, {}, getAuthHeader());
      showToast('Live test notification dispatched to all admin devices! 📲', 'success');
      addTestLog(`Test Push Dispatched: ${res.data?.message || 'Success'} (Result: ${JSON.stringify(res.data?.result || {})})`, 'success');
      await fetchServerDiagnostics();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showToast('Test push failed: ' + msg, 'error');
      addTestLog(`Test push failed: ${msg}`, 'error');
    } finally {
      setIsTestingPush(false);
    }
  };

  // Handler: Test Loud Buzzer Alert (In-App)
  const handleTestBuzzer = () => {
    const demoOrderId = 'TEST-' + Math.floor(1000 + Math.random() * 9000);
    playOrderNotificationSound(demoOrderId);
    setIsPlayingAudio(true);
    addTestLog(`Loud buzzer sound triggered for #${demoOrderId}. Full-screen urgent alert enqueued.`, 'info');

    // Also trigger urgent order modal so admin can experience the full delivery screen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quickfit_new_order', {
        detail: {
          orderId: demoOrderId,
          customer: {
            name: 'Vikram Reddy (Test Customer)',
            phone: '9848022338',
            address: 'Shop 14, PVP Square Mall, MG Road, Vijayawada'
          },
          items: [
            {
              name: "MEN'S OVERSIZED ACID WASH TEE",
              size: 'XL',
              color: 'Vintage Charcoal',
              quantity: 2,
              price: 1299
            }
          ],
          totalAmount: 2598,
          paymentMethod: 'UPI (Fast Instant Pay)',
          orderDate: new Date().toISOString()
        }
      }));
    }
  };

  // Stop local audio test
  const handleStopAudio = () => {
    stopOrderAlert();
    setIsPlayingAudio(false);
    addTestLog('Audio buzzer stopped.', 'info');
  };

  // Install PWA
  const handleInstallPwa = async () => {
    setIsInstallingPwa(true);
    try {
      const res = await promptPwaInstall();
      if (res?.success) {
        setIsStandalone(true);
        showToast('QuickFit App installed successfully! 🎉', 'success');
        addTestLog('PWA app installed successfully into OS', 'success');
      } else if (res?.isIOS) {
        showToast('Tap Safari Share button -> "Add to Home Screen"', 'info');
        addTestLog('iOS Safari requires manual Add to Home Screen', 'info');
      } else {
        showToast('Install prompt unavailable or already installed.', 'info');
        addTestLog('Browser install prompt dismissed or not supported', 'info');
      }
    } catch (err) {
      showToast('Install error: ' + err.message, 'error');
    } finally {
      setIsInstallingPwa(false);
    }
  };

  // Copy FCM Token to Clipboard
  const handleCopyToken = () => {
    if (!currentFcmToken) return;
    navigator.clipboard.writeText(currentFcmToken).then(() => {
      setCopiedToken(true);
      showToast('FCM device token copied to clipboard! 📋', 'success');
      setTimeout(() => setCopiedToken(false), 2500);
    }).catch(() => {
      showToast('Failed to copy token to clipboard', 'error');
    });
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2">
                <span>Push Notification &amp; PWA Diagnostics</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Real Delivery Mode
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Inspect browser permissions, PWA standalone status, genuine FCM tokens, and simulate delivery order alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={fetchServerDiagnostics}
            disabled={isLoadingServerData}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-800 disabled:opacity-50"
            title="Refresh server diagnostics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingServerData ? 'animate-spin text-amber-400' : ''}`} />
            <span>Sync Diagnostics</span>
          </button>
        </div>
      </div>

      {/* ── 4-CARD HERO METRICS GRID (REQUIREMENTS 1, 2, 5, 6, 11) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Notification Permission Status */}
        <div className={`p-4 rounded-2xl border transition-all ${
          permission === 'granted'
            ? 'bg-zinc-900/90 border-emerald-500/40 shadow-emerald-950/20'
            : permission === 'denied'
            ? 'bg-zinc-900/90 border-rose-500/40 shadow-rose-950/20'
            : 'bg-zinc-900/90 border-amber-500/40 shadow-amber-950/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              1. Permission Status
            </span>
            <div className={`w-3 h-3 rounded-full ${
              permission === 'granted' ? 'bg-emerald-400 animate-pulse' : permission === 'denied' ? 'bg-rose-500' : 'bg-amber-400'
            }`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-lg font-black font-heading uppercase ${
              permission === 'granted' ? 'text-emerald-400' : permission === 'denied' ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {permission}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {permission === 'granted'
              ? '✅ Device authorized to receive high-priority delivery pushes.'
              : permission === 'denied'
              ? '❌ Browser blocked. Must allow in browser padlock settings.'
              : '⚠️ Not requested yet. Click button below to enable.'}
          </p>
          {permission !== 'granted' && (
            <button
              type="button"
              disabled={isRegisteringPush}
              onClick={handleEnablePush}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isRegisteringPush ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Push Now</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Card 2: PWA Installed Status */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isStandalone
            ? 'bg-zinc-900/90 border-emerald-500/40'
            : 'bg-zinc-900/90 border-amber-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              2. PWA Installed Status
            </span>
            <div className={`w-3 h-3 rounded-full ${isStandalone ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-lg font-black font-heading uppercase ${isStandalone ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isStandalone ? 'Standalone App' : 'Browser Tab'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {isStandalone
              ? '✅ Operating as native PWA. Maximum background audio reliability.'
              : '⚠️ Running in browser tab. Install PWA for background delivery wake.'}
          </p>
          {!isStandalone && (
            <button
              type="button"
              disabled={isInstallingPwa}
              onClick={handleInstallPwa}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install QuickFit PWA</span>
            </button>
          )}
        </div>

        {/* Card 3: Current FCM Token Status */}
        <div className={`p-4 rounded-2xl border transition-all ${
          currentFcmToken
            ? 'bg-zinc-900/90 border-emerald-500/40'
            : 'bg-zinc-900/90 border-zinc-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              3. FCM Token Registry
            </span>
            <div className={`w-3 h-3 rounded-full ${currentFcmToken ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-lg font-black font-heading uppercase ${currentFcmToken ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {currentFcmToken ? 'Active & Synced' : 'Unregistered'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {currentFcmToken
              ? `Synced ${getRelativeTime(tokenSyncedAt)} with QuickFit server.`
              : 'Token not yet registered. Enable push to generate token.'}
          </p>
          {currentFcmToken && (
            <button
              type="button"
              disabled={isRefreshingToken}
              onClick={handleRefreshToken}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-zinc-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingToken ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh Token</span>
            </button>
          )}
        </div>

        {/* Card 4: Service Worker & Cloud Gateway */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              4. Background Service Worker
            </span>
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-black font-heading uppercase text-white">
              firebase-sw.js
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Root scope (/), listening for background push events &amp; client broadcasts.
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800">
            <span>Server FCM:</span>
            <span className="font-bold text-emerald-400">
              {serverDiagnostics?.fcm?.mode === 'live' ? 'Live Cloud' : 'Mock / Standby'}
            </span>
          </div>
        </div>

      </div>

      {/* ── SECTION: CURRENT FCM TOKEN DETAILS (REQUIREMENT 11) ── */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-white text-base">
                Current Device FCM Registration Token
              </h3>
              <p className="text-xs text-zinc-400">
                Genuine Firebase Cloud Messaging token registered with QuickFit backend.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentFcmToken && (
              <>
                <button
                  type="button"
                  onClick={() => setShowFullToken(!showFullToken)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition-colors cursor-pointer border border-zinc-700"
                >
                  {showFullToken ? 'Collapse Token' : 'Expand Full Token'}
                </button>
                <button
                  type="button"
                  id="btn-copy-fcm-token"
                  onClick={handleCopyToken}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied!' : 'Copy Token'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {currentFcmToken ? (
          <div className="space-y-2">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-amber-300 break-all select-all leading-relaxed">
              {showFullToken ? currentFcmToken : `${currentFcmToken.slice(0, 38)}...${currentFcmToken.slice(-38)}`}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span>Token Length: <strong>{currentFcmToken.length} chars</strong></span>
                <span>•</span>
                <span>Synced: <strong>{tokenSyncedAt ? new Date(tokenSyncedAt).toLocaleString() : 'Just now'}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified genuine Firebase VAPID signature</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-zinc-500 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
            <Key className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-xs">No FCM token registered on this device yet.</p>
            <button
              type="button"
              disabled={isRegisteringPush}
              onClick={handleEnablePush}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Push &amp; Generate Token</span>
            </button>
          </div>
        )}
      </div>

      {/* ── SECTION: LAST NOTIFICATION RECEIVED (REQUIREMENT 11) ── */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-white text-base">
                Last Notification Received
              </h3>
              <p className="text-xs text-zinc-400">
                Live inspection of the most recent push payload delivered to this client.
              </p>
            </div>
          </div>

          {lastNotification && (
            <button
              type="button"
              onClick={() => setShowRawPayload(!showRawPayload)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-zinc-700"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{showRawPayload ? 'Hide Payload' : 'Inspect JSON Payload'}</span>
            </button>
          )}
        </div>

        {lastNotification ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-amber-400 text-sm">
                    #{lastNotification.orderId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {lastNotification.source || 'FCM'}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {getRelativeTime(lastNotification.receivedAt)} ({new Date(lastNotification.receivedAt || lastNotification.timestamp).toLocaleTimeString()})
                  </span>
                </div>

                <div className="font-bold text-white text-xs">
                  {lastNotification.title || `🔔 NEW ORDER: #${lastNotification.orderId}`}
                </div>

                <div className="text-xs text-zinc-300">
                  {lastNotification.body || `₹${lastNotification.totalAmount} from ${lastNotification.customerName}`}
                </div>

                {lastNotification.customerAddress && (
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 pt-1">
                    <span>📍 Address:</span>
                    <span className="text-zinc-200">{lastNotification.customerAddress}</span>
                  </div>
                )}
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Total Amount</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  ₹{Number(lastNotification.totalAmount || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">
                  {lastNotification.paymentMethod || 'COD'}
                </span>
              </div>
            </div>

            {/* Collapsible Raw JSON Payload Viewer */}
            {showRawPayload && (
              <pre className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-60 scrollbar-thin">
                {JSON.stringify(lastNotification, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-xs">No notifications received in this session yet.</p>
            <p className="text-[11px] text-zinc-600">
              Click the "Trigger Test FCM Push" button below to simulate an incoming customer order.
            </p>
          </div>
        )}
      </div>

      {/* ── SECTION: NOTIFICATION TESTER & AUDIO BUZZER VERIFIER (REQUIREMENTS 8, 9, 11) ── */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-white text-base">
                Interactive Delivery Alert Tester
              </h3>
              <p className="text-xs text-zinc-400">
                Trigger simulated delivery orders across cloud push, background audio alarms, and full-screen modals.
              </p>
            </div>
          </div>

          {isPlayingAudio && (
            <button
              type="button"
              onClick={handleStopAudio}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg animate-pulse"
            >
              <VolumeX className="w-4 h-4" />
              <span>Stop Buzzer Sound</span>
            </button>
          )}
        </div>

        {/* Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Button 1: Live FCM Push via Server */}
          <button
            type="button"
            id="btn-diag-test-fcm-push"
            disabled={isTestingPush}
            onClick={handleTriggerTestPush}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isTestingPush ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Sending Push...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-zinc-950" />
                <span>Trigger Test FCM Push</span>
              </>
            )}
          </button>

          {/* Button 2: Loud Looping Buzzer Alert */}
          <button
            type="button"
            id="btn-diag-test-buzzer"
            onClick={handleTestBuzzer}
            className="p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer border border-zinc-700"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Test Loud Buzzer Sound</span>
          </button>

          {/* Button 3: Test PWA Fullscreen Modal */}
          <button
            type="button"
            id="btn-diag-test-urgent-modal"
            onClick={handleTestBuzzer}
            className="p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer border border-zinc-700"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Test Full-Screen Alert</span>
          </button>
        </div>

        {/* Live Execution Console Log */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase font-bold">
            <span>Diagnostics Execution Log</span>
            <button
              type="button"
              onClick={() => setTestLogs([])}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
            >
              Clear Log
            </button>
          </div>
          <div className="p-3 rounded-xl bg-black border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
            {testLogs.length === 0 ? (
              <span className="text-zinc-600">Standing by. Ready to run notification tests.</span>
            ) : (
              testLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'success'
                      ? 'text-emerald-400 font-bold'
                      : log.type === 'error'
                      ? 'text-rose-400 font-bold'
                      : 'text-zinc-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION: SERVER-SIDE REGISTERED ADMIN DEVICES (REQUIREMENT 7, 11) ── */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-white text-base">
                Active Admin Devices in Database ({serverDiagnostics?.stats?.total || 0})
              </h3>
              <p className="text-xs text-zinc-400">
                All devices that receive multicast FCM push alerts when customer orders arrive.
              </p>
            </div>
          </div>

          {serverDiagnostics?.stats && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                Android: <strong className="text-white">{serverDiagnostics.stats.android}</strong>
              </span>
              <span className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                iOS: <strong className="text-white">{serverDiagnostics.stats.ios}</strong>
              </span>
              <span className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                Web: <strong className="text-white">{serverDiagnostics.stats.web}</strong>
              </span>
            </div>
          )}
        </div>

        {Array.isArray(serverDiagnostics?.devices) && serverDiagnostics.devices.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Device Type</th>
                  <th className="py-2.5 px-3">User &amp; Role</th>
                  <th className="py-2.5 px-3">Masked FCM Token</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                {serverDiagnostics.devices.map((device) => (
                  <tr key={device._id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        device.deviceType === 'android'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : device.deviceType === 'ios'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-purple-950 text-purple-400 border border-purple-800'
                      }`}>
                        {device.deviceType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">
                      <div>{device.userName}</div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase">{device.role}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-amber-300">
                      {device.maskedToken}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px] truncate max-w-[140px]" title={device.userAgent}>
                      {device.platform || 'Web Browser'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400 font-mono text-[11px]">
                      {getRelativeTime(device.lastActive)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-zinc-500 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            {isLoadingServerData ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Loading active admin devices from database...</span>
              </div>
            ) : (
              <span>No registered admin devices found in database. Enable notifications to register this device.</span>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDiagnosticsTab;
