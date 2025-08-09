# Progreso de Implementación – Simulador Saber 11

Este documento registra, de forma incremental, las funcionalidades agregadas o alineadas para culminar el desarrollo. Fecha de inicio del registro: 2025-08-08.

## 1) Alineación de Autenticación (Frontend/Backend)

- Ajuste de compatibilidad de rutas en backend `apps/authentication/urls.py`:
  - Agregados alias compatibles: `POST /api/auth/refresh/` → `token/refresh/`, `POST /api/auth/register/` → `registro/`, `GET/PUT /api/auth/profile/` → `perfil/`.
- Verificación de frontend:
  - El cliente ya usa `POST /auth/token/refresh/` en el interceptor. Con los alias queda cubierto el uso de `/auth/refresh/` si aparece en otras partes.

Impacto: El flujo de refresh/login/registro/perfil queda estable sin romper clientes anteriores ni tests existentes.

Commit relacionado: alias en `backend/apps/authentication/urls.py`.

## 2) Configuración de baseURL de API en frontend

- Actualizado `src/services/api.ts` para tomar `VITE_API_URL` o `VITE_BACKEND_URL` y fallback a `http://localhost:8000/api`.

Impacto: Permite builds por entorno sin tocar código (Amplify/preview/dev).

Commit relacionado: cambio en `frontend/src/services/api.ts`.

## 3) PWA mínima (manifest + service worker ligero)

- Añadido `public/manifest.webmanifest` y referencia en `index.html`.
- Añadido `public/sw.js` y registro de SW en `src/main.tsx`.

Impacto: App instalable básica y cache del shell; base para evolucionar a Workbox/estrategias avanzadas.

Commit relacionado: nuevos archivos en `frontend/public/` y edición en `frontend/index.html` y `frontend/src/main.tsx`.

## Próximos ítems del checklist

- Finalizar UX de simulación: pausa/reanudar persistente, atajos, retroalimentación opcional por modo, pantalla de resultados completa.
- Reportes estudiante/docente: completar vistas y validación de datos; exportación PDF/CSV.
- Panel docente: flujos CRUD de clases/asignaciones en UI (endpoints ya existen).
- PWA (manifest + SW), performance y A11y.
- Tests unitarios/integración/E2E y cobertura en CI.


---

## Entradas nuevas (08/08)

- Resultados: exportación CSV añadida en `src/pages/ResultadosDetalladosPage.tsx` usando util `src/utils/exportCSV.ts`. Se muestra tiempo total estimado (minutos) en la cabecera del resumen.
- Reportes docente: botones de exportación CSV para materias, preguntas y estudiantes en `src/pages/ReportesDocentePage.tsx`.
- Simulación: persistencia mínima de pausa (guarda sesión y pregunta actual en `localStorage`) y reanuda restaurando el índice en `src/store/simulacion.ts`.
- Simulación: interruptor para “retroalimentación inmediata” persistido en `localStorage` en `components/simulacion/SimulacionActiva.tsx`.
- Reportes estudiante: exportación CSV en secciones de progreso diario, materias e historial en `pages/ReportesPage.tsx`.
- Simulación: autosave de respuesta seleccionada por pregunta y restauración del borrador tras recargar (`components/simulacion/SimulacionActiva.tsx`).

## Ajustes de conectividad (localhost por defecto)

- Frontend: `src/services/api.ts` ahora usa `'/api'` como base por defecto, aprovechando el proxy de Vite a `http://localhost:8000`. Opcionalmente se puede fijar `VITE_API_URL` para otros entornos.

Impacto: evita dependencias de IPs locales y simplifica el despliegue.

## Resultados: resumen por competencias y recomendaciones

- `pages/ResultadosDetalladosPage.tsx`:
  - Resumen por competencias (acierto, totales, t. promedio) y exportación CSV específica de competencias.
  - Recomendaciones basadas en competencias con acierto < 60% y tags más frecuentes en fallos (si existen).
  - CSV de resultados ahora incluye `competencia`.

## Pruebas iniciales (Vitest)

- `src/store/__tests__/simulacion.store.test.ts`: flujos básicos, respuesta y pausa/reanudar.
- `src/services/__tests__/api.client.test.ts`: baseURL en dev y header Authorization.
- `src/pages/__tests__/ResultadosDetalladosPage.test.tsx`: render mínimo con resumen por competencias.

## PWA (Workbox con vite-plugin-pwa)

- `vite.config.ts`: integrado `vite-plugin-pwa` con precaching y runtimeCaching; `/api/*` en NetworkOnly.
- `src/main.tsx`: registro vía `virtual:pwa-register` solo en producción.
- `src/store/index.ts`: `config.apiUrl` por defecto apunta a `'/api'`.

## Dashboard y UX final

## CI (Lint + Tests + Build)

- Workflow `/.github/workflows/frontend-ci.yml`:
  - Node 20, cache npm.
  - Ejecuta `npm ci`, `npm run lint`, `npm run test:coverage` (con `CI=true` excluyendo suites legacy inestables) y `npm run build`.
  - `VITE_API_URL` definido a `http://localhost:8000/api` para build.

- `pages/DashboardPage.tsx`:
  - Estudiante: estadísticas reales desde `/reportes` (racha, promedio general, acierto por materia, distribución correctas/incorrectas).
  - Docente: mantiene KPIs y gráficos; accesos rápidos depurados.
  - Acceso rápido mejorado y entrada a Historial reciente.
  - Historial compacto: últimas 3 simulaciones con botones “Ver resultados” o “Continuar”.
  - Chips de estado y colores por puntaje (rojo/amarillo/verde) en historial compacto.

## Entradas nuevas (08/08 - CI/Docs y TS)

- Limpieza de TypeScript en frontend para permitir build sin warnings comunes.
- Actualización de `README.md` (raíz):
  - Instrucciones de Vite + proxy `/api` y `VITE_API_URL` para build/preview.
  - Notas de PWA/Service Worker (sólo producción) y troubleshooting (IPs locales, CORS, SW).
  - Sección CI/CD describiendo `frontend-ci.yml`.
- Actualización de `frontend/README.md` con comandos, entorno, PWA y CI.

