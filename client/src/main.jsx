import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Register PWA service worker (vite-plugin-pwa virtual module)
// This is a no-op in development mode
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // A new service worker is waiting — silently update
    // (autoUpdate: true in vite.config.js handles this automatically)
  },
  onOfflineReady() {
    console.log('[QuickFit PWA] App is ready for offline use');
  },
  onRegistered(r) {
    if (r) {
      // Periodically check for SW updates (every hour)
      setInterval(() => r.update(), 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.warn('[QuickFit PWA] Service Worker registration failed:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
