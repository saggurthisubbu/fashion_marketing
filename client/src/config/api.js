/**
 * QuickFit Production-Grade API Configuration
 * Supports Render Deployed Backend, Vercel Frontend, Mobile Devices, and Localhost Dev.
 */

const PRODUCTION_RENDER_API = 'https://quickfit-backend-m1yl.onrender.com/api';
const envApiUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.PROD || process.env.NODE_ENV === 'production';

const normalizeApiUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const computeApiUrl = () => {
  // 1. If explicit API URL is set via environment variable
  if (envApiUrl && envApiUrl.trim() !== '') {
    return normalizeApiUrl(envApiUrl);
  }

  // 2. In browser environment
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    // Local development/testing fallback
    if (!isProd && (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname))) {
      return `http://${hostname}:5000/api`;
    }

    // Default to Live Render MongoDB Atlas Backend
    return PRODUCTION_RENDER_API;
  }

  return PRODUCTION_RENDER_API;
};

export const API_BASE_URL = computeApiUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const PLACEHOLDER_SHIRT_IMAGE = '/placeholder-shirt.jpg';
export const PLACEHOLDER_PRODUCT_IMAGE = '/placeholder-product.svg';
export const DEFAULT_PLACEHOLDER_IMAGE = '/placeholder-product.svg';

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

  // 4. Cloudinary permanent CDN URL
  if (trimmed.includes('cloudinary.com') || trimmed.includes('res.cloudinary.com')) {
    return trimmed;
  }

  // 5. Absolute URL handling
  if (/^https?:\/\//i.test(trimmed)) {
    // If it's a permanent MongoDB Atlas Media URL with a different origin, normalize it
    if (trimmed.includes('/api/upload/media/')) {
      const mediaId = trimmed.split('/api/upload/media/')[1];
      const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
      return origin ? `${origin}/api/upload/media/${mediaId}` : trimmed;
    }

    // If it's a legacy /uploads/ URL
    if (trimmed.includes('/uploads/')) {
      const fileName = trimmed.split('/uploads/')[1];
      if (fileName) {
        const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
        return origin ? `${origin}/uploads/${fileName}` : `/uploads/${fileName}`;
      }
    }

    // External CDN (Unsplash, Imgur, etc.)
    return trimmed;
  }

  // 6. Relative MongoDB Atlas Cloud Media URL (e.g. "/api/upload/media/..." or "api/upload/media/...")
  if (trimmed.includes('/api/upload/media/') || trimmed.startsWith('api/upload/media/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
    return origin ? `${origin}${cleanPath}` : cleanPath;
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
 * If an image fails to load, gracefully falls back without breaking UI layout.
 */
export const handleImageError = (e, fallback = DEFAULT_PLACEHOLDER_IMAGE) => {
  const target = e.currentTarget;
  const currentSrc = target.src;

  // Prevent infinite loops
  if (target.dataset.errorHandled === 'true') {
    return;
  }
  target.dataset.errorHandled = 'true';

  // If local /uploads failed on remote backend, try frontend static mirror
  if (currentSrc && currentSrc.includes('/uploads/')) {
    const parts = currentSrc.split('/uploads/');
    const fileName = parts[1]?.split('?')[0];
    if (fileName && typeof window !== 'undefined' && !currentSrc.startsWith(window.location.origin)) {
      target.src = `/uploads/${fileName}`;
      return;
    }
  }

  target.onerror = null;
  if (fallback) {
    target.src = fallback;
  }
};
