// ============================================================================
// QuickFit Order Alert Audio System
// ============================================================================

// Replace order-alert.mp3 with any preferred buzzer/ringtone
export const ORDER_ALERT_SOUND_PATH = '/sounds/order-alert.mp3';

// Set of unhandled order IDs awaiting "View Order" or "Accept Order"
const unhandledOrders = new Set();

// Active looping HTML5 Audio instance
let loopAudio = null;

// Synthesizer buzzer audio context for guaranteed audio delivery
let audioCtx = null;
let synthTimer = null;

// Track orders that have been completely handled (to avoid duplicate buzzers)
const handledOrdersHistory = new Set();

/**
 * Initialize / unlock audio on first user interaction
 */
export function unlockAudioContext() {
  try {
    if (!loopAudio && typeof Audio !== 'undefined') {
      // Replace order-alert.mp3 with any preferred buzzer/ringtone
      loopAudio = new Audio(ORDER_ALERT_SOUND_PATH);
      loopAudio.loop = true;
      loopAudio.volume = 1.0;
    }

    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && (!audioCtx || audioCtx.state === 'suspended')) {
        audioCtx = new AudioContextClass();
        audioCtx.resume().catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[Audio Init Notice]:', err?.message);
  }
}

// Auto-register user gesture listener to unlock audio policy
if (typeof window !== 'undefined') {
  const unlockEvents = ['click', 'touchstart', 'keydown'];
  const unlockHandler = () => {
    unlockAudioContext();
    unlockEvents.forEach((ev) => window.removeEventListener(ev, unlockHandler));
  };
  unlockEvents.forEach((ev) => window.addEventListener(ev, unlockHandler, { passive: true }));
}

/**
 * Synthesizes a loud pulsating emergency alert buzzer via Web Audio API.
 * Acts in sync with the MP3 to guarantee loudness across all speakers and devices.
 */
function playEmergencyBuzzerBurst() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
      audioCtx.resume().catch(() => {});
    }

    if (audioCtx.state !== 'running') return;

    const now = audioCtx.currentTime;

    // Dual-tone buzzer: 920Hz & 850Hz with harmonics
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(920, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.25);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(850, now);
    osc2.frequency.exponentialRampToValueAtTime(750, now + 0.25);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.8, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Start playing the loud looping buzzer/ringtone for a new order.
 * Continues looping until View Order or Accept Order is clicked.
 *
 * @param {string} orderId - Unique order reference ID
 */
export function startLoopingOrderAlert(orderId) {
  const cleanId = orderId ? String(orderId).trim() : `order_${Date.now()}`;

  // Check if this specific order was already handled
  if (handledOrdersHistory.has(cleanId)) {
    console.log(`ℹ️ [Audio Alert] Order #${cleanId} has already been handled. Skipping sound.`);
    return false;
  }

  // Add to active unhandled orders
  unhandledOrders.add(cleanId);
  console.log(`🔊 [Audio Alert] Starting loud looping buzzer for Order #${cleanId}. Active unhandled orders: ${unhandledOrders.size}`);

  // 1. Play the MP3 in a continuous loop
  try {
    if (typeof Audio !== 'undefined') {
      if (!loopAudio) {
        // Replace order-alert.mp3 with any preferred buzzer/ringtone
        loopAudio = new Audio(ORDER_ALERT_SOUND_PATH);
        loopAudio.loop = true;
        loopAudio.volume = 1.0;
      }

      loopAudio.loop = true;
      loopAudio.volume = 1.0;

      const playPromise = loopAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('⚠️ [Audio Alert] MP3 autoplay notice:', err?.message);
          // Fallback: try relative or public path if root path is redirected
          if (!loopAudio.src.includes('/public/')) {
            const fallback = new Audio('/public/sounds/order-alert.mp3');
            fallback.loop = true;
            fallback.volume = 1.0;
            fallback.play().then(() => {
              loopAudio = fallback;
            }).catch(() => {});
          }
        });
      }
    }
  } catch (err) {
    console.warn('[Audio Alert Play Error]:', err?.message);
  }

  // 2. Continuous pulse buzzer backup every 1.2s to ensure it is loudly audible
  if (!synthTimer) {
    playEmergencyBuzzerBurst();
    synthTimer = setInterval(() => {
      if (unhandledOrders.size > 0) {
        playEmergencyBuzzerBurst();
      } else {
        clearInterval(synthTimer);
        synthTimer = null;
      }
    }, 1200);
  }

  // 3. Trigger phone vibration (Android & compatible devices)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([500, 250, 500, 250, 500]);
    } catch (e) {}
  }

  return true;
}

/**
 * Stop buzzer for a specific order when "View Order" or "Accept Order" is clicked.
 * If multiple new orders exist, keeps the buzzer playing until ALL new orders are handled.
 *
 * @param {string} orderId - The order ID that was viewed or accepted
 */
export function stopOrderAlert(orderId) {
  if (orderId) {
    const cleanId = String(orderId).trim();
    unhandledOrders.delete(cleanId);
    handledOrdersHistory.add(cleanId);
    console.log(`🔇 [Audio Alert] Order #${cleanId} handled. Remaining unhandled: ${unhandledOrders.size}`);
  } else {
    unhandledOrders.clear();
  }

  // IF MULTIPLE NEW ORDERS EXIST, KEEP THE BUZZER PLAYING UNTIL ALL ARE HANDLED!
  if (unhandledOrders.size > 0) {
    console.log(`🔊 [Audio Alert] Still ${unhandledOrders.size} unhandled new order(s). Buzzer continues playing.`);
    return false;
  }

  // All new orders are handled -> Stop the buzzer immediately
  console.log(`🔇 [Audio Alert] All new orders handled. Stopping buzzer immediately.`);

  if (loopAudio) {
    try {
      loopAudio.pause();
      loopAudio.currentTime = 0;
    } catch (e) {}
  }

  if (synthTimer) {
    clearInterval(synthTimer);
    synthTimer = null;
  }

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch (e) {}
  }

  return true;
}

/**
 * Get count of active unhandled orders awaiting action
 */
export function getUnhandledOrdersCount() {
  return unhandledOrders.size;
}

/**
 * Check if a specific order has already been handled
 */
export function isOrderHandled(orderId) {
  return handledOrdersHistory.has(String(orderId).trim());
}
