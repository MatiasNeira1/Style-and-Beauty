# Revision de ramas - 2026-06-11

## Comandos ejecutados

- `git fetch --all --prune`
- `git branch -a`
- Comparacion de ramas locales/remotas contra `origin/master`
- Revision de diffs relevantes por area: frontend, backend, Docker/config y docs

## Estado observado

- La rama local inicial era `feature/uiux-agenda-auth-endpoints`, pero su upstream remoto quedo eliminado despues del prune: `origin/feature/uiux-agenda-auth-endpoints [gone]`.
- `origin/master` apunta a `97f2d5b`, merge de la rama UI/agenda/auth.
- `watoncitox/master` y `fork/master` apuntan a `f3e45a8`, un commit por delante de `origin/master`.
- `origin/develop` apunta a `3edcf1f` y esta detras de `origin/master`.
- Se creo la rama de trabajo `feature/azure-blob-admin-dashboard` desde `watoncitox/master`.

## Ramas con cambios relevantes no equivalentes a `origin/master`

| Rama | Estado frente a `origin/master` | Area | Decision |
| --- | --- | --- | --- |
| `watoncitox/master` / `fork/master` | 1 commit ahead | Frontend | Usada como base. Corrige `frontend/src/components/services/ProfessionalProfiles.jsx`, donde `origin/master` tenia referencias no definidas y cierre incorrecto. |
| `origin/feature/ms-agenda-creacion-agenda` | 1 ahead, 20 behind; force-update recibido | Agenda, pagos/Webpay, frontend booking, Docker | No se fusiono automaticamente. Es reciente pero divergente y trae cambios de pagos/Webpay fuera del alcance directo de Azure Blob. Debe integrarse en una rama separada con validacion dedicada. |
| `origin/feature/staff-corrections` | 2 ahead, 96 behind; multiples merge bases | Staff, admin, backend perfiles/catalogo/inventario, estilos | No se fusiono automaticamente por antiguedad y divergencia amplia. Se reimplementaron las necesidades actuales de staff/fotos sobre la base vigente. |
| `watoncitox/develop-1` / `fork/develop-1` | 7 ahead, 30 behind | Refactors frontend puntuales | No se fusiono; gran parte esta superada por `master` y el diff vigente era menor. |

## Ramas ya contenidas o sin diff util frente a `origin/master`

- `develop`
- `feature/agenda-frontend-sync`
- `feature/auth-api-images-admin-fix`
- `feature/devops/style-beauty-ui-dashboard`
- `feature/integracion-agenda-logout-validacion`
- `feature/java21-validaciones-tests`
- `feature/ms-agenda`
- `feature/ms-extra`
- `feature/ms-inventario`
- `feature/ms-pagos`
- `frontend-bosquejo-premium`
- `Nueva-arquitectura`
- `origin/backup/feature-ms-agenda-creacion-agenda-20260610-222849`
- `origin/copilot/resuelve-conflictos`
- `origin/feature/admin-logout-button`
- `origin/feature/agenda-frontend-sync`
- `origin/feature/devops/style-beauty-ui-dashboard`
- `origin/feature/frontend-mejoras-y-fixes`
- `origin/feature/frontend/Panel-administrativo`
- `origin/feature/java21-validaciones-tests`
- `origin/feature/ms-agenda/creacion-agenda`
- `origin/feature/ms-catalogo`
- `origin/feature/ms-extra`
- `origin/feature/ms-perfiles`

## Validacion realizada sobre la rama de trabajo

- `npm run build` en `frontend`: correcto.
- `mvn -f backend/ms-catalogo/pom.xml test`: correcto, 5 tests.
- `mvn -f backend/ms-perfiles/pom.xml test`: correcto, 5 tests.
- `mvn -f backend/ms-inventario/pom.xml test`: correcto, 5 tests.
- `mvn -f backend/Api-gateway/pom.xml test`: correcto, 2 tests.
- `mvn -f backend/ms-agenda/pom.xml test`: correcto, 18 tests.
- `docker compose config --quiet`: correcto.
- `docker compose build ...`: bloqueado por Docker Desktop. El daemon se cayo durante el build con `EOF` y luego `docker info` respondio `500 Internal Server Error` contra `dockerDesktopLinuxEngine`.

## Pendiente

- Reintentar Docker build/push cuando Docker Desktop este estable.
- Integrar o descartar formalmente `origin/feature/ms-agenda-creacion-agenda` en una tarea separada si se quiere sumar Webpay.
