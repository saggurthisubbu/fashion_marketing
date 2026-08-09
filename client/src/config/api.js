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

    // IN LOCALHOST DEVELOPMENT ONLY
    if (!isProd && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return 'http://localhost:5000/api';
    }

    // Local mobile phone testing on Wi-Fi (e.g. 192.168.x.x) during local dev
    if (!isProd && /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return `http://${hostname}:5000/api`;
    }

    // PRODUCTION BUILD / DEPLOYED DOMAIN (Vercel, custom domain, etc.)
    // Single source of truth backend is deployed on Render
    return PRODUCTION_RENDER_API;
  }

  return isProd ? PRODUCTION_RENDER_API : 'http://localhost:5000/api';
};

export const API_BASE_URL = computeApiUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

console.log('[API CONFIG] Environment:', isProd ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('[API CONFIG] Active Base URL:', API_BASE_URL);
console.log('[API CONFIG] Active Origin:', API_ORIGIN);

/**
 * Normalizes image URLs for cross-device compatibility across Localhost, Mobile, and Render.
 */
export const resolveImageUrl = (imgUrl) => {
  if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';
  }

  const trimmed = imgUrl.trim();

  // If image URL is stored with /uploads/ (relative or with old host)
  if (trimmed.includes('/uploads/')) {
    const relativePart = '/uploads/' + trimmed.split('/uploads/')[1];
    return `${API_ORIGIN}${relativePart}`;
  }

  // Direct external image URLs (e.g. Unsplash, Cloudinary)
  return trimmed;
};
