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

console.log('[API CONFIG] Environment:', isProd ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('[API CONFIG] Active Base URL:', API_BASE_URL);
console.log('[API CONFIG] Active Origin:', API_ORIGIN);

export const PLACEHOLDER_SHIRT_IMAGE = '/placeholder-shirt.jpg';
export const PLACEHOLDER_PRODUCT_IMAGE = '/placeholder-product.jpg';
export const DEFAULT_PLACEHOLDER_IMAGE = '/placeholder-shirt.jpg';

/**
 * Normalizes image URLs for cross-device compatibility across Localhost, Mobile, Cloudinary, Vercel, and Render.
 * Converts relative upload paths (e.g., 'uploads/shirt1.jpg' or '/uploads/shirt1.jpg') to full URLs (${API_ORIGIN}/uploads/...).
 * Handles null, undefined, missing slash, blob URLs, Base64 data URIs, and fallback placeholders.
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
    return PLACEHOLDER_SHIRT_IMAGE;
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

  // 4. Absolute URL containing /uploads/ (e.g. from local server or remote backend)
  if (/^https?:\/\//i.test(trimmed)) {
    if (trimmed.includes('/uploads/')) {
      const fileName = trimmed.split('/uploads/')[1];
      if (fileName) {
        const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
        return origin ? `${origin}/uploads/${fileName}` : `/uploads/${fileName}`;
      }
    }
    // External CDN (Unsplash, Cloudinary, Imgur, etc.)
    return trimmed;
  }

  // 5. Relative upload paths: e.g. "uploads/shirt1.jpg", "/uploads/shirt1.jpg", "uploads\\shirt1.jpg"
  if (trimmed.includes('uploads/')) {
    const fileName = trimmed.split('uploads/')[1].replace(/^\/+/, '');
    const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
    return origin ? `${origin}/uploads/${fileName}` : `/uploads/${fileName}`;
  }

  // 6. Root assets (e.g. /placeholder-shirt.jpg, /placeholder-product.jpg, /logo.png)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // 7. Generic relative filename fallback (e.g. "shirt1.jpg")
  const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
  return origin ? `${origin}/uploads/${trimmed}` : `/uploads/${trimmed}`;
};
