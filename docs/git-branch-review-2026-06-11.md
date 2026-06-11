# Revision de ramas upstream - 2026-06-11

Fuente oficial validada: https://github.com/MatiasNeira1/Style-and-Beauty.git

## Comandos ejecutados

- `git remote -v`
- `git remote add upstream https://github.com/MatiasNeira1/Style-and-Beauty.git`
- `git fetch upstream --prune`
- `git branch -r`
- Comparacion de `feature/azure-blob-admin-dashboard` contra todas las ramas `upstream/*`.
- Revision de diffs relevantes por frontend, backend, microservicios, Docker/config, Azure/Cloudflare/env y documentacion.

## Estado observado

- `origin` ya apuntaba al repositorio oficial `MatiasNeira1/Style-and-Beauty`.
- Se agrego `upstream` apuntando al mismo repositorio oficial para trabajar explicitamente con `upstream/*`.
- La rama de trabajo se mantiene como `feature/azure-blob-admin-dashboard`.
- La rama parte de `watoncitox/master` (`f3e45a8`), que contiene `upstream/master` (`97f2d5b`) mas el fix de `ProfessionalProfiles.jsx`.
- Los cambios de Azure Blob Storage, panel staff, servicios, productos, dashboard y frontend quedaron protegidos en el commit local `1ff44d1`.

## Ramas upstream revisadas

| Rama | Estado frente a HEAD inicial | Area | Decision |
| --- | --- | --- | --- |
| `upstream/master` | 0 commits pendientes; estaba contenido en la rama actual | Base oficial | Sin merge adicional. |
| `upstream/develop` | 0 commits pendientes; atrasado frente a master actual | Config/API gateway | Sin merge adicional. |
| `upstream/copilot/resuelve-conflictos` | 0 commits pendientes; rama antigua contenida | Merge/conflictos previos | Sin merge adicional. |
| `upstream/backup/feature-ms-agenda-creacion-agenda-20260610-222849` | 0 commits pendientes | Agenda | Sin merge adicional. |
| `upstream/feature/admin-logout-button` | 0 commits pendientes | Frontend/admin | Ya contenido o superado. |
| `upstream/feature/agenda-frontend-sync` | 0 commits pendientes | Agenda/frontend/docs | Ya contenido o superado. |
| `upstream/feature/devops/style-beauty-ui-dashboard` | 0 commits pendientes | DevOps/dashboard | Ya contenido o superado. |
| `upstream/feature/frontend-mejoras-y-fixes` | 0 commits pendientes | Frontend fixes | Ya contenido o superado. |
| `upstream/feature/frontend/Panel-administrativo` | 0 commits pendientes | Panel admin | Ya contenido o superado. |
| `upstream/feature/java21-validaciones-tests` | 0 commits pendientes | Java/tests | Ya contenido o superado. |
| `upstream/feature/ms-agenda/creacion-agenda` | 0 commits pendientes | Agenda/config | Ya contenido o superado. |
| `upstream/feature/ms-catalogo` | 0 commits pendientes | Catalogo | Ya contenido o superado. |
| `upstream/feature/ms-extra` | 0 commits pendientes | Extra bookings | Ya contenido o superado. |
| `upstream/feature/ms-perfiles` | 0 commits pendientes | Perfiles | Ya contenido o superado. |
| `upstream/feature/ms-agenda-creacion-agenda` | 1 commit pendiente: `3396fec` | Agenda, ms-pagos, Webpay, booking frontend, Docker | Integrado localmente como `f8abfdf`, resolviendo conflictos manuales. |
| `upstream/feature/staff-corrections` | 1 commit puntual pendiente: `0f274f6`; rama antigua y muy divergente | Staff/perfiles/admin | No se fusiono la rama completa. Se integro manualmente la parte estable: persistencia de `experienciaAnios`, actualizacion de especialidad y campos editables de staff. |

## Conflictos resueltos

- `backend/ms-agenda/src/main/java/com/style/beauty/ms_agenda/service/CitaService.java`: se adopto `normalizarAZoneAgenda(...)` del commit Webpay.
- `backend/ms-pagos/.dockerignore`: se conservaron las reglas anti-secretos existentes.
- `docker-compose.yml`: se conservaron `ms-extra` y `ms-notificacion-audit`, y se integro la configuracion requerida por `ms-pagos`.
- `frontend/src/pages/client/BookingPage.jsx`: se incorporaron imports/utilidades de Webpay preservando el flujo actual.

## Cambios integrados desde upstream

- Webpay/pagos simulado desde `upstream/feature/ms-agenda-creacion-agenda`.
- Pagina de resultado de pago y utilidades frontend de redireccion Webpay.
- Clientes internos de `ms-pagos` hacia agenda/catalogo.
- Ajustes de agenda para normalizacion de zona horaria y estado `PENDIENTE_PAGO`.
- Persistencia de `experienciaAnios` para staff desde `upstream/feature/staff-corrections`, integrada manualmente sobre la base actual con Azure.

## Pendiente de esta revision

- Revalidar lint/build/tests despues de la integracion.
- Reintentar Docker build secuencial por servicio.
- No hacer push hasta confirmacion explicita.
