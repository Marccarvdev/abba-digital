import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for Offline access & installable PWA behavior
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // Self-healing: automatically unregister service workers on localhost to prevent dev caching of older builds
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log('Service Worker auto-unregistered on localhost to clear dev cache.');
              window.location.reload();
            }
          });
        }
      });
    } else {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully with scope:', registration.scope);
          // Check for service worker updates immediately
          registration.update();
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Sincronização e recarregamento automático no cliente quando a PWA atualiza
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('Novo Service Worker detectado. Recarregando a página para aplicar atualizações...');
          window.location.reload();
        }
      });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
