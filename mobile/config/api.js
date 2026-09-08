/**
 * QuickFit Mobile API Configuration
 * Always uses the production Render backend.
 * Removes all window/import.meta/browser dependencies.
 */

export const API_BASE_URL = 'https://quickfit-backend-m1yl.onrender.com/api';
export const API_ORIGIN   = 'https://quickfit-backend-m1yl.onrender.com';

export const DEFAULT_PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800' width='600' height='800'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2318181b'/%3E%3Cstop offset='100%25' stop-color='%2309090b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='800' fill='url(%23bg)'/%3E%3Ctext x='300' y='380' text-anchor='middle' fill='%23ffffff' font-family='system-ui,sans-serif' font-size='22' font-weight='900' letter-spacing='2'%3EQUICKFIT%3C/text%3E%3Ctext x='300' y='420' text-anchor='middle' fill='%2371717a' font-family='system-ui,sans-serif' font-size='13' font-weight='600' letter-spacing='1'%3EPREMIUM APPAREL%3C/text%3E%3C/svg%3E";

/**
 * Resolves any image path/URL to a fully-qualified HTTPS URL suitable for
 * use in React Native Image components. In production we always serve from
 * the Render backend, so relative /uploads/ paths get the full origin prefix.
 */
export const resolveImageUrl = (imgUrl) => {
  if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
    return DEFAULT_PLACEHOLDER_IMAGE;
  }
  const trimmed = imgUrl.trim();

  // Blob/data URIs — not usable on native, return placeholder
  if (trimmed.startsWith('blob:')) return DEFAULT_PLACEHOLDER_IMAGE;
  if (trimmed.startsWith('data:image/')) return trimmed;

  // Absolute URL — ensure HTTPS
  if (/^https?:\/\//i.test(trimmed)) {
    if (trimmed.includes('/uploads/')) {
      const relativePart = '/uploads/' + trimmed.split('/uploads/')[1];
      return `${API_ORIGIN}${relativePart}`;
    }
    let url = trimmed;
    if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      url = 'https://' + url.slice(7);
    }
    return url;
  }

  // Relative /uploads/ path
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${API_ORIGIN}${cleanPath}`;
  }

  // Root-relative path
  if (trimmed.startsWith('/')) return `${API_ORIGIN}${trimmed}`;

  // Generic relative
  return `${API_ORIGIN}/${trimmed}`;
};
