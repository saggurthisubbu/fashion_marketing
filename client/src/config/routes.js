/**
 * QuickFit Centralized Route & URL Configuration
 * Defines permanent URLs and route constants for both customer storefront and administrator dashboard.
 */

export const ROUTES = {
  HOME: '/',
  CATALOG: '/#catalog-section',
  CATEGORIES: '/#categories-section',
  ABOUT: '/#about',
  CONTACT: '/#contact',
  ADMIN: '/admin',
  ADMIN_HASH: '/#admin',
  ADMIN_QUERY: '/?admin=true',
  API_BASE: '/api'
};

export const DEPLOYMENT_ENDPOINTS = {
  // Live Render Deployed MongoDB Backend API
  BACKEND_API_URL: 'https://quickfit-backend-m1yl.onrender.com/api',
  BACKEND_ORIGIN: 'https://quickfit-backend-m1yl.onrender.com',
  
  // Local Development
  LOCAL_FRONTEND_URL: 'http://localhost:3000',
  LOCAL_BACKEND_URL: 'http://localhost:5000',
  LOCAL_ADMIN_URL: 'http://localhost:3000/admin',
  LOCAL_UNIFIED_URL: 'http://localhost:5000/admin'
};

export default ROUTES;
