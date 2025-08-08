import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registrar Service Worker solo en producción
if (import.meta && (import.meta as any).env?.PROD) {
  // Import dinámico para evitar error en dev cuando el plugin PWA no está activo
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      try { registerSW({ immediate: true }); } catch {}
    })
    .catch(() => {});
}

// En desarrollo, forzar desregistro de cualquier SW previo y limpiar caches
if (import.meta && !(import.meta as any).env?.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => {});
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
  }
}
