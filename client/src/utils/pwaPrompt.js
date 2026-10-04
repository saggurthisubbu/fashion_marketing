// ============================================================================
// QuickFit PWA Utilities - Install Prompt & Standalone Mode Detection
// ============================================================================

let deferredPrompt = null;

if (typeof window !== 'undefined') {
  // Capture the native Chrome/Edge/Android beforeinstallprompt event globally
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.deferredPwaPrompt = e;
    console.log('📲 [PWA] beforeinstallprompt captured globally');
    window.dispatchEvent(new CustomEvent('quickfit_pwa_prompt_ready'));
  });

  window.addEventListener('appinstalled', (e) => {
    console.log('✅ [PWA] QuickFit app installed successfully!');
    deferredPrompt = null;
    window.deferredPwaPrompt = null;
    localStorage.setItem('quickfit_pwa_installed', 'true');
    window.dispatchEvent(new CustomEvent('quickfit_pwa_installed'));
  });
}

/**
 * Check if QuickFit is currently running in Standalone PWA mode
 * @returns {boolean}
 */
export function isPwaInstalled() {
  if (typeof window === 'undefined') return false;

  const isStandaloneMatch = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = 'standalone' in window.navigator && Boolean(window.navigator.standalone);
  const isAndroidApp = typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://');
  const isLocalStorageFlag = localStorage.getItem('quickfit_pwa_installed') === 'true';

  return Boolean(isStandaloneMatch || isIOSStandalone || isAndroidApp || (isLocalStorageFlag && isStandaloneMatch));
}

/**
 * Get whether the native browser install prompt is ready to be triggered
 * @returns {boolean}
 */
export function canPromptPwaInstall() {
  return Boolean(deferredPrompt || (typeof window !== 'undefined' && window.deferredPwaPrompt));
}

/**
 * Prompt the user to install QuickFit PWA (Android / Chrome / Edge)
 * @returns {Promise<{success: boolean, outcome?: string, reason?: string}>}
 */
export async function promptPwaInstall() {
  const prompt = deferredPrompt || (typeof window !== 'undefined' ? window.deferredPwaPrompt : null);
  if (!prompt) {
    // If iOS Safari or unsupported, return guidance
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    return {
      success: false,
      isIOS,
      reason: isIOS
        ? 'iOS Safari requires manual "Add to Home Screen" via the Share button'
        : 'Install prompt is not currently available or app is already installed'
    };
  }

  try {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    console.log(`📲 [PWA] User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      deferredPrompt = null;
      if (typeof window !== 'undefined') window.deferredPwaPrompt = null;
      localStorage.setItem('quickfit_pwa_installed', 'true');
      return { success: true, outcome };
    }

    return { success: false, outcome };
  } catch (err) {
    console.error('❌ [PWA Install Error]:', err);
    return { success: false, reason: err.message };
  }
}
