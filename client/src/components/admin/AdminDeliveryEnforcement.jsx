import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  AlertTriangle,
  Smartphone,
  Download,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  X,
  HelpCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { isPwaInstalled, promptPwaInstall, canPromptPwaInstall } from '../../utils/pwaPrompt';
import { registerAdminPushNotifications, refreshAdminFcmToken } from '../../config/firebase';

/**
 * AdminDeliveryEnforcement – Real Delivery App Order Alert Enforcement
 * 
 * Satisfies Requirements:
 * 1. Force admin users to enable push notifications.
 * 2. Force admin users to install QuickFit as a PWA.
 * 3. Show warning if notifications are disabled.
 * 4. Show warning if PWA is not installed.
 */
export const AdminDeliveryEnforcement = ({
  authToken,
  onNavigateTab,
  showToast = () => {}
}) => {
  const [notificationPermission, setNotificationPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
  });
  const [isStandalone, setIsStandalone] = useState(() => isPwaInstalled());
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isInstallingPwa, setIsInstallingPwa] = useState(false);
  const [isEnforcementModalOpen, setIsEnforcementModalOpen] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  // Monitor notification permission & PWA state
  useEffect(() => {
    const updateStates = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
      setIsStandalone(isPwaInstalled());
    };

    updateStates();

    window.addEventListener('quickfit_pwa_prompt_ready', updateStates);
    window.addEventListener('quickfit_pwa_installed', updateStates);
    window.addEventListener('focus', updateStates);

    return () => {
      window.removeEventListener('quickfit_pwa_prompt_ready', updateStates);
      window.removeEventListener('quickfit_pwa_installed', updateStates);
      window.removeEventListener('focus', updateStates);
    };
  }, []);

  // Check if enforcement modal should be shown:
  // If notification permission is NOT granted, delivery app operations are blocked/warned
  useEffect(() => {
    if (notificationPermission !== 'granted') {
      const dismissedUntil = localStorage.getItem('quickfit_admin_enforcement_snooze');
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        setIsEnforcementModalOpen(true);
      }
    } else {
      setIsEnforcementModalOpen(false);
    }
  }, [notificationPermission]);

  // Request Notification Permission & Register FCM Token
  const handleEnablePush = async () => {
    setIsEnablingPush(true);
    try {
      const res = await registerAdminPushNotifications(authToken);
      if (res?.success) {
        setNotificationPermission('granted');
        showToast('Push Notifications Enabled! Real FCM Device Token Registered 🔔', 'success');
        if (isPwaInstalled()) {
          setIsEnforcementModalOpen(false);
        }
      } else {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setNotificationPermission(Notification.permission);
        }
        showToast(res?.error || 'Could not enable push notifications.', 'warning');
      }
    } catch (err) {
      showToast('Notification error: ' + err.message, 'error');
    } finally {
      setIsEnablingPush(false);
    }
  };

  // Trigger PWA Installation
  const handleInstallPwa = async () => {
    setIsInstallingPwa(true);
    try {
      const res = await promptPwaInstall();
      if (res?.success) {
        setIsStandalone(true);
        showToast('QuickFit App installed successfully! 🎉', 'success');
        setIsEnforcementModalOpen(false);
      } else if (res?.isIOS) {
        setShowIosInstructions(true);
      } else {
        // Fallback for browsers where beforeinstallprompt was dismissed or unavailable
        showToast('Click browser menu (⋮ or Share) and select "Install" or "Add to Home Screen".', 'info');
      }
    } catch (err) {
      showToast('Install error: ' + err.message, 'error');
    } finally {
      setIsInstallingPwa(false);
    }
  };

  const handleSnoozeModal = () => {
    // Snooze modal for 10 minutes, but warning banner stays visible
    localStorage.setItem('quickfit_admin_enforcement_snooze', String(Date.now() + 10 * 60 * 1000));
    setIsEnforcementModalOpen(false);
  };

  const isPushBlocked = notificationPermission === 'denied';
  const isPushDisabled = notificationPermission !== 'granted';
  const isPwaMissing = !isStandalone;

  return (
    <>
      {/* ── PERSISTENT TOP WARNING BANNERS FOR ADMIN ── */}
      <div className="space-y-1.5 px-4 pt-3 pb-1">
        
        {/* Warning 1: Push Notifications Disabled / Blocked */}
        {isPushDisabled && (
          <div
            id="admin-warning-notifications"
            className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
              isPushBlocked
                ? 'bg-rose-950/90 border-rose-600/80 text-rose-100 shadow-rose-950/50'
                : 'bg-amber-950/90 border-amber-500/80 text-amber-100 shadow-amber-950/50'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isPushBlocked ? 'bg-rose-900/80 text-rose-300 border border-rose-500/40' : 'bg-amber-900/80 text-amber-300 border border-amber-500/40'
              }`}>
                {isPushBlocked ? <BellOff className="w-5 h-5 animate-pulse" /> : <AlertTriangle className="w-5 h-5 animate-bounce" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-wide">
                    {isPushBlocked
                      ? '🚨 Push Notifications Blocked — Order Alerts Cannot Ring'
                      : '⚠️ Push Notifications Disabled — Enable for Real-Time Delivery Buzzer'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/40 border border-white/20">
                    Required for Delivery Operations
                  </span>
                </div>
                <p className="text-[11px] opacity-90 mt-0.5 max-w-2xl leading-relaxed">
                  {isPushBlocked
                    ? 'Your browser is currently blocking notifications for QuickFit. Click the site padlock 🔒 in the URL address bar, allow Notifications, and reload.'
                    : 'Real-time order alarms, loud buzzer ringtones, and lockscreen popups require push notification permission on this device.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('diagnostics')}
                  className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
                >
                  Diagnostics
                </button>
              )}

              {!isPushBlocked ? (
                <button
                  type="button"
                  id="btn-enable-notifications-warning"
                  disabled={isEnablingPush}
                  onClick={handleEnablePush}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isEnablingPush ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enabling...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Enable Notifications Now</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEnforcementModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>How to Unblock</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Warning 2: PWA App Not Installed (Running in Browser Tab) */}
        {isPwaMissing && (
          <div
            id="admin-warning-pwa"
            className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-black text-xs sm:text-sm text-white uppercase tracking-wide">
                    📲 Running in Web Browser — Install QuickFit App for Guaranteed Background Alerts
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 max-w-2xl leading-relaxed">
                  Browser tabs can be put to sleep by the OS. Installing QuickFit as a PWA grants dedicated wake-locks, background service worker priority, and full-screen urgent order alerts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                id="btn-install-pwa-warning"
                disabled={isInstallingPwa}
                onClick={handleInstallPwa}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isInstallingPwa ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Opening...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Install App (PWA)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── FORCED DELIVERY APP SETUP MODAL FOR ADMIN USERS ── */}
      {isEnforcementModalOpen && (
        <div
          id="admin-enforcement-modal-backdrop"
          className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-labelledby="enforcement-modal-title"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border-2 border-amber-500 shadow-[0_0_80px_rgba(245,158,11,0.3)] text-white overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center justify-between text-zinc-950 font-black shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-black text-amber-400 shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div>
                  <h3 id="enforcement-modal-title" className="font-heading font-black text-base sm:text-lg uppercase tracking-wide">
                    Delivery Partner Setup Required
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-900 font-extrabold block">
                    QuickFit Store Management &amp; Dispatch Portal
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSnoozeModal}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-zinc-950 flex items-center justify-center transition-colors cursor-pointer"
                title="Snooze warning (10 mins)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Like real delivery partner apps (Swiggy / Zomato / DoorDash), QuickFit requires <strong>push notifications</strong> and <strong>app installation</strong> so you never miss an incoming customer order.
              </p>

              {/* Requirement 1: Push Notifications */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      notificationPermission === 'granted'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : 'bg-amber-950 text-amber-400 border border-amber-700'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">1. Push Notifications</h4>
                      <p className="text-[11px] text-zinc-400">
                        Plays loud order buzzer even when phone is locked or screen is off.
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    notificationPermission === 'granted'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                      : isPushBlocked
                      ? 'bg-rose-950 text-rose-400 border border-rose-700'
                      : 'bg-amber-950 text-amber-400 border border-amber-700'
                  }`}>
                    {notificationPermission === 'granted' ? 'Enabled' : isPushBlocked ? 'Blocked' : 'Disabled'}
                  </span>
                </div>

                {notificationPermission !== 'granted' ? (
                  !isPushBlocked ? (
                    <button
                      type="button"
                      id="btn-enforcement-enable-notifications"
                      disabled={isEnablingPush}
                      onClick={handleEnablePush}
                      className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
                    >
                      {isEnablingPush ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                          <span>Requesting Permission...</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 text-zinc-950" />
                          <span>Enable Push Notifications</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Notifications are blocked in your browser:</span>
                      </p>
                      <ol className="list-decimal pl-5 space-y-0.5 text-[11px] text-rose-300">
                        <li>Tap the padlock 🔒 or tune icon in the browser address bar.</li>
                        <li>Switch <strong>Notifications</strong> from Blocked to <strong>Allow</strong>.</li>
                        <li>Refresh this page to activate the FCM push service.</li>
                      </ol>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Push notifications active on this device!</span>
                  </div>
                )}
              </div>

              {/* Requirement 2: Install QuickFit PWA */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isStandalone
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">2. Install App (PWA)</h4>
                      <p className="text-[11px] text-zinc-400">
                        Launches as a standalone app with persistent audio &amp; background alarms.
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    isStandalone
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    {isStandalone ? 'Installed' : 'Browser Tab'}
                  </span>
                </div>

                {!isStandalone ? (
                  <button
                    type="button"
                    id="btn-enforcement-install-pwa"
                    disabled={isInstallingPwa}
                    onClick={handleInstallPwa}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98 disabled:opacity-50"
                  >
                    {isInstallingPwa ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                        <span>Prompting Install...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-zinc-950" />
                        <span>Install QuickFit as App</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Running in Standalone App Mode!</span>
                  </div>
                )}
              </div>

              {/* iOS Manual Instructions */}
              {showIosInstructions && (
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs space-y-2">
                  <h5 className="font-black text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>How to Install on iPhone / iPad (Safari)</span>
                  </h5>
                  <ol className="list-decimal pl-5 space-y-1 text-zinc-300 text-[11px]">
                    <li>Tap the <strong>Share</strong> button (box with arrow pointing up) at bottom of Safari.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> in top-right. Launch QuickFit from your home screen.</li>
                  </ol>
                </div>
              )}

              {/* Continue button */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSnoozeModal}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Remind me later
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSnoozeModal();
                    if (onNavigateTab) onNavigateTab('diagnostics');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                >
                  <span>Open Push Diagnostics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDeliveryEnforcement;
