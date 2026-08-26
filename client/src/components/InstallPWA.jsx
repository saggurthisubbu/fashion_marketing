import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Zap } from 'lucide-react';

/**
 * InstallPWA – Shows a beautiful animated install banner when the browser
 * fires the `beforeinstallprompt` event (Chrome / Android).
 *
 * On iOS (Safari), shows a manual "Add to Home Screen" guide instead,
 * since iOS doesn't support the install prompt API.
 */
export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if already dismissed (persisted in localStorage)
  useEffect(() => {
    const wasDismissed = localStorage.getItem('quickfit-pwa-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Detect iOS Safari for manual guide
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode =
      'standalone' in window.navigator && window.navigator.standalone;

    if (isIOS && !isInStandaloneMode) {
      // Show iOS guide after a short delay
      const timer = setTimeout(() => setShowIOSGuide(true), 4000);
      return () => clearTimeout(timer);
    }

    // Listen for Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowBanner(false);
        setInstalled(true);
      }
    } catch (err) {
      console.error('PWA install error:', err);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    // Remember dismissal for 7 days
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('quickfit-pwa-dismissed', expiry.toString());
    setDismissed(true);
  };

  // Nothing to show if installed, dismissed, or no prompt available
  if (installed || dismissed) return null;

  /* ─────────────────────────────────────────────
     ANDROID / CHROME: Install Banner
  ───────────────────────────────────────────── */
  if (showBanner && deferredPrompt) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'calc(100% - 32px)',
          maxWidth: '420px',
          animation: 'slideUpBanner 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
        aria-live="polite"
        role="dialog"
        aria-label="Install QuickFit App"
      >
        <style>{`
          @keyframes slideUpBanner {
            from { opacity: 0; transform: translateX(-50%) translateY(24px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          .install-btn-inner:hover { background: #1a1a1a !important; }
        `}</style>

        <div
          style={{
            background: '#000000',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Top row: icon + text + close */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            {/* App icon */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <img
                src="/icons/icon-192x192.png"
                alt="QuickFit"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#ffffff',
                  fontFamily: 'Outfit, Inter, sans-serif',
                  lineHeight: 1.3,
                }}
              >
                Install QuickFit App
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.4,
                }}
              >
                Add to home screen for faster access &amp; offline browsing
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                color: 'rgba(255,255,255,0.6)',
                transition: 'background 0.2s',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { icon: <Zap size={11} />, text: 'Instant access' },
              { icon: <Smartphone size={11} />, text: 'Works offline' },
              { icon: <Download size={11} />, text: 'No App Store needed' },
            ].map(({ icon, text }) => (
              <span
                key={text}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  borderRadius: '100px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                }}
              >
                {icon}
                {text}
              </span>
            ))}
          </div>

          {/* Install button */}
          <button
            id="pwa-install-btn"
            onClick={handleInstall}
            className="install-btn-inner"
            style={{
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'Outfit, Inter, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              transition: 'background 0.2s, transform 0.1s',
              letterSpacing: '0.01em',
            }}
          >
            <Download size={16} />
            Install QuickFit App
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     iOS SAFARI: Manual "Add to Home Screen" guide
  ───────────────────────────────────────────── */
  if (showIOSGuide) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'calc(100% - 32px)',
          maxWidth: '380px',
          animation: 'slideUpBanner 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
        role="dialog"
        aria-label="Install QuickFit on iPhone"
      >
        <style>{`
          @keyframes slideUpBanner {
            from { opacity: 0; transform: translateX(-50%) translateY(24px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        <div
          style={{
            background: '#000000',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <img src="/icons/icon-192x192.png" alt="QuickFit" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff', fontFamily: 'Outfit, Inter, sans-serif' }}>
                Install on iPhone
              </p>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Close"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Steps */}
          {[
            { step: '1', text: 'Tap the Share button', sub: '(square with arrow up, at bottom of Safari)' },
            { step: '2', text: 'Tap "Add to Home Screen"', sub: 'Scroll down in the share sheet' },
            { step: '3', text: 'Tap "Add"', sub: 'QuickFit will appear on your home screen' },
          ].map(({ step, text, sub }) => (
            <div
              key={step}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  flexShrink: 0,
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {step}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
                  {text}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' }}>
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Arrow pointing down toward Share button */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid #000000',
            margin: '0 auto',
          }}
        />
      </div>
    );
  }

  return null;
}

export default InstallPWA;
