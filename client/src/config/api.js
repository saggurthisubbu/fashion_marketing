/**
 * QuickFit Production-Ready API Configuration
 * Supports Localhost, Mobile Devices on Local Network (Wi-Fi/LAN), and Production Deployments.
 */

// 1. Read environment variable
const envApiUrl = import.meta.env.VITE_API_URL;

// 2. Compute dynamic API URL based on runtime environment
const computeApiUrl = () => {
  if (envApiUrl && envApiUrl.trim() !== '') {
    return envApiUrl.trim().replace(/\/+$/, '');
  }

  // In browser runtime
  if (typeof window !== 'undefined') {
    const { hostname, protocol, port } = window.location;

    // Desktop localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }

    // Mobile phone / Tablet accessing via Local IP (e.g. 192.168.x.x)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return `http://${hostname}:5000/api`;
    }

    // Production Domain (e.g. quickfit.com or subdomains)
    return `${protocol}//${hostname}${port && port !== '80' && port !== '443' && port !== '3000' ? `:${port}` : ''}/api`;
  }

  return 'http://localhost:5000/api';
};

export const API_BASE_URL = computeApiUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

console.log('📡 [API Config]: Active Backend API URL ->', API_BASE_URL);

/**
 * Normalizes and resolves product image URLs for cross-device compatibility
 */
export const resolveImageUrl = (imgUrl) => {
  if (!imgUrl) return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';

  // Relative uploaded path (/uploads/...) -> prepend API origin
  if (imgUrl.startsWith('/uploads')) {
    return `${API_ORIGIN}${imgUrl}`;
  }

  // Fix hardcoded localhost if accessed from mobile device
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (imgUrl.includes('localhost:5000/uploads/') || imgUrl.includes('127.0.0.1:5000/uploads/')) {
      return imgUrl.replace(/(localhost|127\.0\.0\.1):5000/, `${window.location.hostname}:5000`);
    }
  }

  return imgUrl;
};
