/**
 * QuickFit Production-Grade API Configuration
 * Supports Render Deployed Backend, Vercel Frontend, Mobile Devices, and Localhost Dev.
 */

const PRODUCTION_RENDER_API = 'https://quickfit-backend-m1yl.onrender.com/api';
const envApiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || (typeof process !== 'undefined' && process.env?.VITE_API_URL) || '';
const isProd = typeof import.meta !== 'undefined' && import.meta.env ? Boolean(import.meta.env.PROD) : (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');


const normalizeApiUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const computeApiUrl = () => {
  // 1. In browser environment
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    // Local development/testing fallback (covers localhost, 127.0.0.1, and local LAN IP for mobile testing)
    if (!isProd && (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname))) {
      return `http://${hostname}:5000/api`;
    }

    // If explicit env variable is set and not in local dev
    if (envApiUrl && envApiUrl.trim() !== '') {
      return normalizeApiUrl(envApiUrl);
    }

    // Default to Live Render MongoDB Atlas Backend
    return PRODUCTION_RENDER_API;
  }

  // Non-browser (Node.js/SSR/testing):
  if (envApiUrl && envApiUrl.trim() !== '') {
    return normalizeApiUrl(envApiUrl);
  }

  return PRODUCTION_RENDER_API;
};

export const API_BASE_URL = computeApiUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const PLACEHOLDER_SHIRT_IMAGE = '/placeholder-shirt.jpg';
export const PLACEHOLDER_PRODUCT_IMAGE = '/placeholder-product.jpg';
export const DEFAULT_PLACEHOLDER_IMAGE = '/placeholder-product.jpg';

/**
 * Normalizes image URLs for cross-device compatibility across Localhost, Mobile, Cloudinary, Vercel, and Render.
 * Handles Cloudinary URLs, MongoDB Atlas Cloud Media URLs, Base64 Data URIs, Blob previews, and fallbacks.
 */
export const resolveImageUrl = (imgUrl) => {
  // 1. Validation for null, undefined, or empty fields
  if (
    !imgUrl ||
    typeof imgUrl !== 'string' ||
    imgUrl.trim() === '' ||
    imgUrl.trim() === 'null' ||
    imgUrl.trim() === 'undefined'
  ) {
    return DEFAULT_PLACEHOLDER_IMAGE;
  }

  let trimmed = imgUrl.trim().replace(/\\/g, '/');

  // 2. Direct Blob URL (from URL.createObjectURL during admin upload preview)
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 3. Direct Base64 Data URI (from FileReader during instant preview)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 4. Cloudinary permanent CDN URL - maximize quality, disable lossy compression, and enable retina DPR
  if (trimmed.includes('cloudinary.com') || trimmed.includes('res.cloudinary.com')) {
    if (trimmed.includes('/upload/')) {
      const parts = trimmed.split('/upload/');
      const prefix = parts[0] + '/upload/';
      let rest = parts[1];

      // Remove aggressive compression or small width limitations
      rest = rest.replace(/q_auto(?::[a-z0-9_-]+)?/g, 'q_auto:best');
      rest = rest.replace(/w_\d+,?/g, ''); // strip forced downscaled widths

      if (rest.startsWith('v') && /^v\d+\//.test(rest)) {
        return `${prefix}f_auto,q_auto:best,dpr_auto/${rest}`;
      } else if (!rest.includes('q_auto:best')) {
        return `${prefix}f_auto,q_auto:best,dpr_auto/${rest}`;
      }
      return `${prefix}${rest}`;
    }
    return trimmed;
  }

  // 5. MongoDB Atlas Cloud Media URL handling (both relative and absolute)
  if (trimmed.includes('/api/upload/media/')) {
    const mediaId = trimmed.split('/api/upload/media/')[1].split(/[?#]/)[0];
    const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
    return origin ? `${origin}/api/upload/media/${mediaId}` : `/api/upload/media/${mediaId}`;
  }

  // 6. Absolute URL handling
  if (/^https?:\/\//i.test(trimmed)) {
    // If it's a legacy /uploads/ URL
    if (trimmed.includes('/uploads/')) {
      const fileName = trimmed.split('/uploads/')[1];
      if (fileName) {
        const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
        return origin ? `${origin}/uploads/${fileName}` : `/uploads/${fileName}`;
      }
    }

    // External CDN (Unsplash, etc.) - upgrade to high-resolution with max clarity
    if (trimmed.includes('images.unsplash.com')) {
      return trimmed
        .replace(/([?&])q=\d+/i, '$1q=95')
        .replace(/([?&])w=\d+/i, '$1w=1400');
    }

    return trimmed;
  }

  // 7. Relative upload paths: e.g. "uploads/shirt1.jpg", "/uploads/shirt1.jpg"
  if (trimmed.includes('uploads/')) {
    const fileName = trimmed.split('uploads/')[1].replace(/^\/+/, '');
    const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
    return origin ? `${origin}/uploads/${fileName}` : `/uploads/${fileName}`;
  }

  // 8. Root assets (e.g. /placeholder-shirt.jpg, /placeholder-product.svg, /logo.png)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // 9. Generic relative filename fallback
  const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
  return origin ? `${origin}/uploads/${trimmed}` : `/uploads/${trimmed}`;
};

/**
 * Resilient image error handler:
 * If an image fails to load on one host, tries fallback host before any placeholder.
 */
export const handleImageError = (e, fallback = DEFAULT_PLACEHOLDER_IMAGE) => {
  const target = e.currentTarget;
  const currentSrc = target.src;

  // Prevent infinite loops
  if (target.dataset.errorHandled === 'true') {
    return;
  }

  // If a MongoDB Atlas media URL failed on one origin, try alternate origins before falling back
  if (currentSrc && currentSrc.includes('/api/upload/media/')) {
    const mediaId = currentSrc.split('/api/upload/media/')[1]?.split(/[?#]/)[0];
    if (mediaId) {
      const step = parseInt(target.dataset.mediaRetryStep || '0', 10);
      target.dataset.mediaRetryStep = String(step + 1);

      // Attempt 1: Try via current window origin / Vite proxy
      if (step === 0 && typeof window !== 'undefined') {
        const localProxyUrl = `${window.location.origin}/api/upload/media/${mediaId}`;
        if (currentSrc !== localProxyUrl) {
          target.src = localProxyUrl;
          return;
        }
      }
      // Attempt 2: Try localhost:5000 directly
      if (step <= 1) {
        const local5000 = `http://localhost:5000/api/upload/media/${mediaId}`;
        if (currentSrc !== local5000) {
          target.src = local5000;
          return;
        }
      }
      // Attempt 3: Try Render backend
      if (step <= 2) {
        const renderUrl = `https://quickfit-backend-m1yl.onrender.com/api/upload/media/${mediaId}`;
        if (currentSrc !== renderUrl) {
          target.src = renderUrl;
          return;
        }
      }
    }
  }

  // If local /uploads failed on remote backend, try frontend static mirror
  if (currentSrc && currentSrc.includes('/uploads/')) {
    const parts = currentSrc.split('/uploads/');
    const fileName = parts[1]?.split('?')[0];
    if (fileName && typeof window !== 'undefined' && !currentSrc.startsWith(window.location.origin)) {
      target.src = `/uploads/${fileName}`;
      return;
    }
  }

  target.dataset.errorHandled = 'true';
  target.onerror = null;
  if (fallback) {
    target.src = fallback;
  }
};

