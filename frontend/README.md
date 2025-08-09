# Frontend (React + Vite)

Aplicación React 18 + TypeScript con Vite.

## Comandos

```bash
# desarrollo
npm run dev

# lint, tipos, tests y cobertura
npm run lint
npm run typecheck
npm run test:coverage

# build y preview
npm run build
npm run preview
```

## Variables de entorno

- En desarrollo no definas `VITE_API_URL`; se usa el proxy `/api` a `http://127.0.0.1:8000`.
- Para build/preview local, define:
  - `VITE_API_URL=http://127.0.0.1:8000/api`

Ejemplos:
```powershell
# PowerShell
$env:VITE_API_URL = "http://127.0.0.1:8000/api"; npm run build; npm run preview
```
```bash
# bash/zsh
VITE_API_URL=http://127.0.0.1:8000/api npm run build && npm run preview
```

## PWA y Service Worker

- `vite-plugin-pwa` genera el SW en producción. En desarrollo se desregistra el SW y se limpian caches.
- Las rutas `/api/*` están excluidas de cualquier caché para no interferir con la autenticación.

## CI (GitHub Actions)

- Workflow: `.github/workflows/frontend-ci.yml`.
- Jobs: `lint`, `typecheck` (`tsc -b`), `test:coverage` (Vitest), `build` (Vite).
- Artefactos: cobertura y JUnit.

## Notas de desarrollo

- Estado global con Zustand; preferencias mínimas en `localStorage`.
- Axios configurado para usar `/api` en dev y `VITE_API_URL` en build/preview.
- Para evitar problemas en Windows PowerShell, usa `;` para encadenar comandos.
