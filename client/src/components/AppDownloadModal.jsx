import React, { useState, useEffect, useRef } from 'react';

// =============================================================================
// APP STORE CONFIGURATION — update these once your apps are published
// =============================================================================
export const APP_CONFIG = {
  // Set to your real Play Store URL when published:
  // 'https://play.google.com/store/apps/details?id=com.quickfit.app'
  PLAY_STORE_URL: null,

  // Direct APK download — place QuickFit.apk in the /public folder
  APK_URL: '/QuickFit.apk',

  // Set to your real App Store URL when published:
  // 'https://apps.apple.com/app/quickfit/id123456789'
  APP_STORE_URL: null,

  // Used for the desktop QR code — update to your production URL
  get WEB_APP_URL() { return window.location.origin; },

  APP_TAGLINE: 'Luxury Menswear · 60-Min Delivery',
};

// =============================================================================
// DEVICE DETECTION
// =============================================================================
function detectDevice() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  return 'desktop';
}

// QR code via api.qrserver.com — no npm package needed
function getQRUrl(text, size = 150) {
  return (
    'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size +
    '&data=' + encodeURIComponent(text) +
    '&color=0f172a&bgcolor=ffffff&qzone=2&format=svg'
  );
}

// =============================================================================
// SMALL SHARED COMPONENTS
// =============================================================================
const ComingSoon = () => (
  <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
    Coming Soon
  </span>
);

const StoreBtn = ({ emoji, heading, subheading, gradient, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={'flex items-center gap-3 w-full px-5 py-4 rounded-2xl text-left transition-all ' +
      (disabled ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] cursor-pointer')}
    style={{ background: gradient }}
  >
    <span className="text-2xl flex-shrink-0">{emoji}</span>
    <div className="min-w-0">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-white/75">{subheading}</div>
      <div className="text-base font-black text-white truncate">{heading}</div>
    </div>
    {!disabled && (
      <svg className="w-4 h-4 ml-auto flex-shrink-0 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    )}
  </button>
);

// =============================================================================
// ANDROID VIEW
// =============================================================================
const AndroidView = ({ onClose }) => {
  const playReady = Boolean(APP_CONFIG.PLAY_STORE_URL);
  const handlePlay = () => { if (playReady) window.open(APP_CONFIG.PLAY_STORE_URL, '_blank', 'noopener'); };
  const handleAPK = () => {
    const a = document.createElement('a');
    a.href = APP_CONFIG.APK_URL;
    a.download = 'QuickFit.apk';
    a.click();
    onClose();
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-3xl shadow-xl mb-3">⚡</div>
        <h2 className="text-xl font-black text-slate-900">Get QuickFit</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">for Android</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Google Play</span>
          {!playReady && <ComingSoon />}
        </div>
        <StoreBtn emoji="▶️" heading="Google Play Store" subheading="Get it on"
          gradient="linear-gradient(135deg,#00875A 0%,#00A572 100%)" onClick={handlePlay} disabled={!playReady} />
        {!playReady && (
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">Play Store listing in review — coming soon</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Direct Download</div>
        <StoreBtn emoji="📦" heading="Download APK File" subheading="Install directly on Android"
          gradient="linear-gradient(135deg,#1e293b 0%,#334155 100%)" onClick={handleAPK} disabled={false} />
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Enable “Install from unknown sources” in Android Settings if prompted.
        </p>
      </div>
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <span>🔒</span>
        <p className="text-[10px] text-emerald-700 font-semibold">QuickFit APK is malware-free and digitally signed. Safe to install.</p>
      </div>
    </div>
  );
};

// =============================================================================
// IOS VIEW
// =============================================================================
const IOSView = () => {
  const appStoreReady = Boolean(APP_CONFIG.APP_STORE_URL);
  const handleAppStore = () => { if (appStoreReady) window.open(APP_CONFIG.APP_STORE_URL, '_blank', 'noopener'); };
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-3xl shadow-xl mb-3">⚡</div>
        <h2 className="text-xl font-black text-slate-900">Get QuickFit</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">for iPhone &amp; iPad</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Apple App Store</span>
          {!appStoreReady && <ComingSoon />}
        </div>
        <StoreBtn emoji="🍎" heading="Download on the App Store" subheading="Available on"
          gradient="linear-gradient(135deg,#007AFF 0%,#5856D6 100%)" onClick={handleAppStore} disabled={!appStoreReady} />
        {!appStoreReady && (
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">iOS app under Apple review — launching very soon</p>
        )}
      </div>
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
        <span className="text-xl flex-shrink-0">💡</span>
        <div>
          <p className="text-xs font-black text-slate-900">Use the Web App now</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Tap <strong>Share ⎙</strong> → <strong>“Add to Home Screen”</strong> in Safari for a native app-like experience.
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// DESKTOP VIEW
// =============================================================================
const DesktopView = () => {
  const playReady = Boolean(APP_CONFIG.PLAY_STORE_URL);
  const appStoreReady = Boolean(APP_CONFIG.APP_STORE_URL);
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900">Download QuickFit</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">{APP_CONFIG.APP_TAGLINE}</p>
      </div>
      <div className="grid grid-cols-[150px_1fr] gap-5 items-start">
        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="p-2 rounded-2xl border-2 border-slate-100 bg-white shadow-md">
            <img src={getQRUrl(APP_CONFIG.WEB_APP_URL)} alt="Scan QR to open QuickFit on mobile"
              width={140} height={140} className="rounded-xl block" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center font-semibold leading-relaxed">
            Scan with your phone camera
          </p>
        </div>
        {/* Store buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Play Store */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Android</span>
              {!playReady && <ComingSoon />}
            </div>
            <button
              onClick={() => { if (playReady) window.open(APP_CONFIG.PLAY_STORE_URL, '_blank', 'noopener'); }}
              disabled={!playReady}
              className={'flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-white transition-all ' +
                (playReady ? 'hover:scale-[1.02] cursor-pointer hover:shadow-md' : 'opacity-40 cursor-not-allowed grayscale')}
              style={{ background: 'linear-gradient(135deg,#00875A 0%,#00A572 100%)' }}
            >
              <span className="text-lg">▶️</span>
              <div className="text-left">
                <div className="text-[8px] opacity-75 uppercase tracking-widest">Get it on</div>
                <div className="text-xs font-black">Google Play</div>
              </div>
            </button>
          </div>
          {/* App Store */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">iPhone / iPad</span>
              {!appStoreReady && <ComingSoon />}
            </div>
            <button
              onClick={() => { if (appStoreReady) window.open(APP_CONFIG.APP_STORE_URL, '_blank', 'noopener'); }}
              disabled={!appStoreReady}
              className={'flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-white transition-all ' +
                (appStoreReady ? 'hover:scale-[1.02] cursor-pointer hover:shadow-md' : 'opacity-40 cursor-not-allowed grayscale')}
              style={{ background: 'linear-gradient(135deg,#007AFF 0%,#5856D6 100%)' }}
            >
              <span className="text-lg">🍎</span>
              <div className="text-left">
                <div className="text-[8px] opacity-75 uppercase tracking-widest">Download on the</div>
                <div className="text-xs font-black">App Store</div>
              </div>
            </button>
          </div>
          {/* Direct APK */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Android APK</div>
            <a href={APP_CONFIG.APK_URL} download="QuickFit.apk"
              className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-white transition-all hover:scale-[1.02] cursor-pointer hover:shadow-md"
              style={{ background: 'linear-gradient(135deg,#1e293b 0%,#334155 100%)' }}
            >
              <span className="text-lg">📦</span>
              <div className="text-left">
                <div className="text-[8px] opacity-75 uppercase tracking-widest">Direct</div>
                <div className="text-xs font-black">Download APK</div>
              </div>
            </a>
          </div>
        </div>
      </div>
      <div className="pt-2 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center font-medium">
          QuickFit v1.0 · Android 6.0+ · iOS 14+ · Free
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN MODAL
// =============================================================================
export const AppDownloadModal = ({ isOpen, onClose }) => {
  const overlayRef = useRef(null);
  const [device] = useState(() => detectDevice());

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(15,23,42,0.78)', backdropFilter: 'blur(8px)' }}
      role="dialog" aria-modal="true" aria-label="Download QuickFit App"
    >
      <div
        className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95"
        style={{ maxHeight: '92vh' }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm transition-colors cursor-pointer z-10"
          aria-label="Close"
        >✕</button>
        {/* Device-specific content */}
        <div className="px-6 pb-8 pt-5">
          {device === 'android' && <AndroidView onClose={onClose} />}
          {device === 'ios'     && <IOSView />}
          {device === 'desktop' && <DesktopView />}
        </div>
      </div>
    </div>
  );
};