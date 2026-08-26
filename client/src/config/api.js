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

export const DEFAULT_PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800' width='600' height='800'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2318181b'/%3E%3Cstop offset='100%25' stop-color='%2309090b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='800' fill='url(%23bg)'/%3E%3Ctext x='300' y='380' text-anchor='middle' fill='%23ffffff' font-family='system-ui, sans-serif' font-size='22' font-weight='900' letter-spacing='2'%3EQUICKFIT%3C/text%3E%3Ctext x='300' y='420' text-anchor='middle' fill='%2371717a' font-family='system-ui, sans-serif' font-size='13' font-weight='600' letter-spacing='1'%3EPREMIUM APPAREL%3C/text%3E%3C/svg%3E";

/**
 * Normalizes image URLs for cross-device compatibility across Localhost, Mobile, Cloudinary, and Render.
 * Supports Blob URLs, Base64 Data URIs, Cloudinary HTTPS URLs, Relative Multer Paths, and Root Assets.
 */
export const resolveImageUrl = (imgUrl) => {
  if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
    return DEFAULT_PLACEHOLDER_IMAGE;
  }

  const trimmed = imgUrl.trim();

  // 1. Direct Blob URL (from URL.createObjectURL during admin upload preview)
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Direct Base64 Data URI (from FileReader during instant preview)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 3. Absolute URL (Cloudinary, Unsplash, Render backend, external CDN)
  if (/^https?:\/\//i.test(trimmed)) {
    if (trimmed.includes('/uploads/')) {
      if (isProd) {
        // In production (Vercel frontend), keep the full backend URL as-is.
        // Relative /uploads/ paths 404 on Vercel — the backend (Render) serves them.
        // Upgrade http → https to prevent mixed-content blocks on mobile.
        let url = trimmed;
        if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
          url = 'https://' + url.slice(7);
        }
        return url;
      } else {
        // In local dev, Vite proxies /uploads/ → http://localhost:5000/uploads/
        // so we can use a relative path and avoid CORS.
        return '/uploads/' + trimmed.split('/uploads/')[1];
      }
    }
    // Non-uploads absolute URL (Unsplash, Cloudinary, etc.)
    let url = trimmed;
    if (isProd && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      url = 'https://' + url.slice(7);
    }
    return url;
  }

  // 4. Relative backend upload path (e.g., /uploads/image.jpg stored in MongoDB)
  //    In production: prefix with the full Render backend origin so images load on Vercel
  //    In local dev:  keep as /uploads/ — Vite proxy maps it to http://localhost:5000
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (isProd) {
      return `https://quickfit-backend-m1yl.onrender.com${cleanPath}`;
    }
    return cleanPath; // local dev — Vite proxy handles it
  }

  // 5. Root asset path (e.g. /placeholder-product.svg)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // 6. Generic relative path fallback
  return `${API_ORIGIN}/${trimmed}`;
};
