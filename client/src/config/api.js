/**
 * QuickFit Production-Grade API Configuration
 * Supports Vercel Serverless, Render/Railway Deployed Backends, Mobile Devices, and Localhost Dev.
 */

const envApiUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.PROD || process.env.NODE_ENV === 'production';

const computeApiUrl = () => {
  // 1. If explicit production API URL is set via environment variable
  if (envApiUrl && envApiUrl.trim() !== '') {
    return envApiUrl.trim().replace(/\/+$/, '');
  }

  // 2. In browser environment
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;

    // IN PRODUCTION BUILD: NEVER EVER CALL LOCALHOST
    if (isProd) {
      return `${origin}/api`;
    }

    // IN LOCAL DEVELOPMENT ONLY:
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }

    // Local mobile phone testing on Wi-Fi (e.g. 192.168.x.x)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return `http://${hostname}:5000/api`;
    }

    return `${origin}/api`;
  }

  return isProd ? '/api' : 'http://localhost:5000/api';
};

export const API_BASE_URL = computeApiUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

console.log('📡 [API Config]: Environment ->', isProd ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('📡 [API Config]: Active API Base URL ->', API_BASE_URL);

/**
 * Normalizes image URLs for cross-device compatibility
 */
export const resolveImageUrl = (imgUrl) => {
  if (!imgUrl) return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';

  // If image URL is stored as relative path (/uploads/...)
  if (imgUrl.startsWith('/uploads')) {
    return `${API_ORIGIN}${imgUrl}`;
  }

  // If image URL in database has hardcoded localhost:5000 but we are in production or on mobile
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
    if (imgUrl.includes('localhost:5000/uploads/') || imgUrl.includes('127.0.0.1:5000/uploads/')) {
      const filename = imgUrl.split('/uploads/')[1];
      return `${API_ORIGIN}/uploads/${filename}`;
    }
    return imgUrl;
  }

  return imgUrl;
};
