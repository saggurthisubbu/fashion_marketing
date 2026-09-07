import React, { useState, useEffect, useRef } from 'react';

// ============================================================
// CONFIGURATION — paste real store URLs when apps are published
// ============================================================
export const APP_CONFIG = {
  PLAY_STORE_URL: null,   // e.g. 'https://play.google.com/store/apps/details?id=com.quickfit.app'
  APK_URL: '/QuickFit.apk',
  APP_STORE_URL: null,    // e.g. 'https://apps.apple.com/app/quickfit/id123456789'
  get WEB_APP_URL() { return window.location.origin; },
};

// ============================================================
// HELPERS
// ============================================================
function detectDevice() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  return 'desktop';
}

function getQRUrl(text) {
  return (
    'https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=' +
    encodeURIComponent(text) +
    '&color=0f172a&bgcolor=ffffff&qzone=1&format=svg'
  );
}

// ============================================================
// DOWNLOAD BUTTON COMPONENT
// ============================================================
const DLBtn = ({ label, sublabel, icon, bg, onClick, disabled, href, download: dl }) => {
  const cls = [
    'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white text-left',
    'transition-all select-none',
    disabled
      ? 'opacity-40 cursor-not-allowed'
      : 'cursor-pointer hover:brightness-110 active:scale-[0.98] hover:shadow-lg',
  ].join(' ');

  const inner = (
    <>
      <span className="text-xl leading-none flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold uppercase tracking-widest text-white/65 leading-none mb-0.5">
          {sublabel}
        </div>
        <div className="text-sm font-black text-white leading-tight truncate">
          {label}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} download={dl} className={cls} style={{ background: bg }}>
        {inner}
      </a>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls} style={{ background: bg }}>
      {inner}
    </button>
  );
};

// ============================================================
// MAIN MODAL
// ============================================================
export const AppDownloadModal = ({ isOpen, onClose }) => {
  const overlayRef = useRef(null);
  const [device] = useState(() => detectDevice());

  const playReady    = Boolean(APP_CONFIG.PLAY_STORE_URL);
  const appStoreReady = Boolean(APP_CONFIG.APP_STORE_URL);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlay     = () => { if (playReady)     window.open(APP_CONFIG.PLAY_STORE_URL, '_blank', 'noopener'); };
  const handleAppStore = () => { if (appStoreReady) window.open(APP_CONFIG.APP_STORE_URL, '_blank', 'noopener'); };

  return (
    /* ── OVERLAY ── */
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,12,24,0.85)', backdropFilter: 'blur(10px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Download QuickFit App"
    >
      {/* ── CARD ── */}
      <div
        className="relative bg-white w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxWidth: '440px' }}
      >

        {/* ══ HEADER BAND ══ */}
        <div
          className="relative px-5 pt-5 pb-4"
          style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}
        >
          {/* App identity row */}
          <div className="flex items-center gap-3.5 pr-8">
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl shadow-lg"
              style={{ background: 'linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%)' }}
            >
              ⚡
            </div>
            {/* Text */}
            <div className="min-w-0">
              <h2 className="text-lg font-black text-white leading-tight tracking-tight">
                QuickFit
              </h2>
              <p className="text-[11px] font-bold text-amber-400 mt-0.5">
                Luxury Menswear · 60-Min Delivery
              </p>
              {/* Stars */}
              <div className="flex items-center gap-0.5 mt-1.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-[10px] text-slate-400 font-medium ml-1">4.9 · Free</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-sm font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ══ BODY ══ */}
        <div className="px-5 pt-4 pb-2">

          {/* ── Section label ── */}
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Choose your platform
          </p>

          {/* ── DOWNLOAD BUTTONS ── */}
          <div className="space-y-2">

            {/* Google Play */}
            <div className="relative">
              {!playReady && (
                <span
                  className="absolute -top-1.5 right-2.5 z-10 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider"
                  style={{ background: '#f59e0b', color: '#0f172a' }}
                >
                  Coming Soon
                </span>
              )}
              <DLBtn
                icon="▶"
                label="Google Play"
                sublabel="Get it on"
                bg="linear-gradient(135deg,#0b8a4b 0%,#0f9d58 100%)"
                onClick={handlePlay}
                disabled={!playReady}
              />
            </div>

            {/* App Store */}
            <div className="relative">
              {!appStoreReady && (
                <span
                  className="absolute -top-1.5 right-2.5 z-10 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider"
                  style={{ background: '#f59e0b', color: '#0f172a' }}
                >
                  Coming Soon
                </span>
              )}
              <DLBtn
                icon="🍎"
                label="App Store"
                sublabel="Download on the"
                bg="linear-gradient(135deg,#0061d5 0%,#007AFF 100%)"
                onClick={handleAppStore}
                disabled={!appStoreReady}
              />
            </div>

            {/* Direct APK */}
            <DLBtn
              icon="📥"
              label="Download APK"
              sublabel="Android · Direct install"
              bg="linear-gradient(135deg,#0f172a 0%,#1e293b 100%)"
              href={APP_CONFIG.APK_URL}
              dl="QuickFit.apk"
            />

          </div>

          {/* ── QR + Info row ── */}
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            {/* QR */}
            <div className="flex-shrink-0 p-1 bg-white rounded-lg border border-slate-200 shadow-sm">
              <img
                src={getQRUrl(APP_CONFIG.WEB_APP_URL)}
                alt="Scan QR code to open QuickFit"
                width={72}
                height={72}
                className="block rounded"
              />
            </div>
            {/* Text */}
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900">Scan to open on your phone</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Point your camera at the QR code — works on any iOS or Android device.
              </p>
              <p className="text-[10px] font-bold mt-1.5" style={{ color: '#f59e0b' }}>
                ⚡ Android 6.0+ · iOS 14+ · Free
              </p>
            </div>
          </div>

          {/* iOS tip */}
          {device === 'ios' && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-base flex-shrink-0">💡</span>
              <p className="text-[10px] text-blue-700 leading-relaxed">
                <strong>iPhone/iPad:</strong> Tap <strong>Share ⎙</strong> → <strong>"Add to Home Screen"</strong> in Safari for a native app-like experience while the App Store version is in review.
              </p>
            </div>
          )}

          {/* Android APK note */}
          {device === 'android' && (
            <p className="mt-3 text-[10px] text-slate-400 text-center leading-relaxed">
              🔒 APK is malware-free &amp; signed. Enable "Install from unknown sources" if prompted.
            </p>
          )}

        </div>

        {/* ══ FOOTER BAND ══ */}
        <div className="px-5 py-2.5 mt-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-medium">
            QuickFit v1.0 · Vijayawada, India
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">🔒</span>
            <span className="text-[10px] font-black text-slate-600">Secure Download</span>
          </div>
        </div>

      </div>
    </div>
  );
};
