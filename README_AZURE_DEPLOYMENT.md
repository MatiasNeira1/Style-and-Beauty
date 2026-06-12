# Style and Beauty Azure Deployment Guide

This guide prepares the project for Azure deployment without committing secrets.

## Security Blocker: Firebase Key Rotation

The Firebase Admin private key used during local validation was exposed in chat.
Treat that key as compromised. Do not reuse it for Azure, staging, demos, or
production.

Required action before any Azure deployment:

1. Open Firebase/GCP Console.
2. Go to IAM & Admin or Firebase Project Settings > Service accounts.
3. Locate the exposed service account key.
4. Disable/delete/revoke that key.
5. Create a new service account key only if Firebase Admin cannot use workload
   identity in the selected hosting model.
6. Store the new credential as an Azure secret or Key Vault secret.
7. Inject it as `FIREBASE_SERVICE_ACCOUNT_JSON`, or mount it securely and set
   `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_PATH`.

Never commit `serviceAccountKey.json`, Firebase Admin JSON, `.env.azure`, ID
tokens, passwords, database dumps, SQLite runtime files, or private keys.

## Recommended Azure Architecture

Recommended option for this project: Azure Container Apps.

Why:

- Lower operational burden than AKS.
- Better microservice fit than a single App Service plan.
- Supports public ingress for frontend/gateway and internal ingress for
  microservices.
- Scales to zero or low replica counts, useful for Azure for Students.
- Environment variables and secrets can be configured per container app.
- Easier academic defense than AKS while still showing professional separation.

Public components:

- `frontend`: public HTTPS ingress.
- `api-gateway`: public HTTPS ingress, only `/api/**` and documentation routes
  should be exposed intentionally.

Private/internal components:

- `ms-auth`
- `ms-perfiles`
- `ms-catalogo`
- `ms-agenda`
- `ms-inventario`
- `ms-pagos`
- `ms-extra` if a valid image exists
- `ms-notificacion-audit` if audit is required and MongoDB is configured
- PostgreSQL and MongoDB should not be publicly reachable except from allowed
  Azure networking/firewall rules.

Alternatives:

- Azure VM with Docker Compose: cheapest and simplest to explain, but weaker
  secret isolation, patching, uptime, and network separation. Use only for a
  controlled academic demo.
- Azure App Service for Containers: acceptable for frontend plus gateway, but
  less natural for many internal microservices unless using multiple apps and
  VNet integration.
- AKS: not justified for this academic scope. Higher cost and operational
  complexity.

## Docker Images

Docker Hub is the current image source convention:

| Component | Image |
| --- | --- |
| frontend | `docker.io/watoncitoxx/style-and-beauty-frontend:<tag>` |
| api-gateway | `docker.io/watoncitoxx/style-and-beauty-gateway:<tag>` |
| ms-auth | `docker.io/watoncitoxx/style-and-beauty-auth:<tag>` |
| ms-perfiles | `docker.io/watoncitoxx/style-and-beauty-perfiles:<tag>` |
| ms-catalogo | `docker.io/watoncitoxx/style-and-beauty-catalogo:<tag>` |
| ms-agenda | `docker.io/watoncitoxx/style-and-beauty-agenda:<tag>` |
| ms-inventario | `docker.io/watoncitoxx/style-and-beauty-inventario:<tag>` |
| ms-pagos | `docker.io/watoncitoxx/style-and-beauty-pagos:<tag>` |
| ms-extra | `docker.io/watoncitoxx/style-and-beauty-extra:<tag>` |
| ms-notificacion-audit | `docker.io/watoncitoxx/style-and-beauty-notificacion-audit:<tag>` |

Current risk: the repository currently has no source/Dockerfile visible for
`backend/ms-extra` and no source Dockerfile for `backend/ms-notificacion-audit`.
Do not include them in an Azure deployment unless their images are already
published and tested, or their Dockerfiles are restored.

Use immutable tags for demos, for example `2026-06-08-db65796`, not only
`latest`.

## Production Environment Variables

### Frontend

| Variable | Example | Secret |
| --- | --- | --- |
| `VITE_API_URL` | `https://api.styleandbeauty.me/api` | No |
| `VITE_API_BASE_URL` | `https://api.styleandbeauty.me` | No |
| `VITE_ASSETS_BASE_URL` | empty or CDN URL | No |
| `VITE_USE_MOCKS` | `false` | No |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key | No, but environment-specific |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` | No |
| `VITE_FIREBASE_PROJECT_ID` | `<project>` | No |
| `VITE_FIREBASE_STORAGE_BUCKET` | `<bucket>` | No |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `<id>` | No |
| `VITE_FIREBASE_APP_ID` | `<app-id>` | No |

### API Gateway

| Variable | Example | Secret |
| --- | --- | --- |
| `APP_CORS_ALLOWED_ORIGINS` | `https://styleandbeauty.me,https://www.styleandbeauty.me` | No |
| `CORS_ALLOWED_ORIGINS` | same as above | No |
| `SERVER_FORWARD_HEADERS_STRATEGY` | `framework` | No |
| `MS_AUTH_URI` | internal URL for `ms-auth` | No |
| `MS_PERFILES_URI` | internal URL for `ms-perfiles` | No |
| `MS_CATALOGO_URI` | internal URL for `ms-catalogo` | No |
| `MS_AGENDA_URI` | internal URL for `ms-agenda` | No |
| `MS_INVENTARIO_URI` | internal URL for `ms-inventario` | No |
| `MS_PAGOS_URI` | internal URL for `ms-pagos` | No |
| `MS_EXTRA_URI` | internal URL for `ms-extra` | No |
| `MS_NOTIFICACION_AUDIT_URI` | internal URL for audit service | No |

### Microservices

| Variable | Applies to | Secret |
| --- | --- | --- |
| `*_DATASOURCE_URL` | DB-backed services | Usually no, but protect if it embeds credentials |
| `*_DATASOURCE_USERNAME` | DB-backed services | Yes |
| `*_DATASOURCE_PASSWORD` | DB-backed services | Yes |
| `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME` | Optional shared fallback | No |
| `DATABASE_USER` / `DATABASE_PASSWORD` | Optional shared fallback | Yes |
| `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE` | DB-backed services | No |
| `SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE` | DB-backed services | No |
| `SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT` | DB-backed services | No |
| `SPRING_DATASOURCE_HIKARI_IDLE_TIMEOUT` | DB-backed services | No |
| `SPRING_DATASOURCE_HIKARI_MAX_LIFETIME` | DB-backed services | No |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | DB-backed services | No |
| `SPRING_SQL_INIT_MODE` | Agenda/local seed behavior | No |
| `AZURE_STORAGE_CONNECTION_STRING` | `ms-perfiles`, `ms-catalogo`, `ms-inventario` | Yes |
| `AZURE_STORAGE_CONTAINER` | `stylebeauty` | No |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `ms-auth`, `ms-perfiles`, `ms-agenda` | Yes |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | same | No if just path |
| `GOOGLE_APPLICATION_CREDENTIALS` | same / Google Calendar | No if just path |
| `SPRING_DATA_MONGODB_URI` | notification/audit | Yes |
| `GOOGLE_CALENDAR_ENABLED` | agenda | No |
| `GOOGLE_CALENDAR_CREDENTIALS_JSON` | agenda if enabled | Yes |
| `GOOGLE_CALENDAR_CREDENTIALS_PATH` | agenda if enabled | No if just path |

### Azure Blob Storage

Images are uploaded only through backend endpoints. Configure `AZURE_STORAGE_CONNECTION_STRING` as a Container Apps secret and `AZURE_STORAGE_CONTAINER=stylebeauty` for `ms-perfiles`, `ms-catalogo` and `ms-inventario`.

Expected Container Apps service names for this integration:

- `sb-catalogo`
- `sb-perfiles`
- `sb-inventario`

See `docs/azure-blob-storage.md` for upload/delete endpoints, frontend routes touched, Docker commands and Container Apps scale-to-zero notes.
| `GOOGLE_CALENDAR_DEFAULT_CALENDAR_ID` | agenda if enabled | Usually no |
| `SPRING_SECURITY_USER_NAME` | pagos/audit basic auth | Yes |
| `SPRING_SECURITY_USER_PASSWORD` | pagos/audit basic auth | Yes |

Recommended production values:

- `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`
- `SPRING_SQL_INIT_MODE=never`
- `SPRING_JPA_SHOW_SQL=false`
- `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=2` for Azure for Students or
  Supabase pooler.

## Database Strategy

Option 1: Azure Database for PostgreSQL Flexible Server.

Advantages:

- Native Azure integration.
- Firewall/private networking controls.
- Professional deployment story.
- Predictable managed backups.

Risks:

- Cost can be higher than external free tiers.
- Needs firewall/VNet configuration.
- Azure for Students credits can be consumed quickly if left running.

Option 2: Supabase.

Advantages:

- Lower cost/free tier.
- Quick setup.
- Good for academic demo if already used.

Risks:

- Pooler limits are easy to saturate with many microservices.
- Network latency and external dependency.
- JDBC/PgBouncer compatibility requires careful URL settings.

Recommendation:

- For the most professional Azure story: Azure Database for PostgreSQL Flexible
  Server with small SKU and firewall restricted to Azure services/container
  environment.
- For lowest cost: Supabase Pooler, with `prepareThreshold=0` in every JDBC URL
  and Hikari `maximum-pool-size=2`, `minimum-idle=0`.

Migration/seed policy:

- Do not run `scripts/seed-local-validation.sql` in production.
- Production should use curated business data only.
- Use `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` after schema is ready.
- If schema migration is needed, add Flyway/Liquibase before production-grade
  deployment. Until then, run schema setup manually in staging and document it.

## MongoDB Strategy

If `ms-notificacion-audit` is required:

- Use MongoDB Atlas free/shared tier for lowest cost, or Azure Cosmos DB for
  MongoDB API for an Azure-native story.
- Store `SPRING_DATA_MONGODB_URI` as a secret.
- Do not deploy local `n8n/n8n_data` or SQLite files.

If audit is not required for the demo:

- Keep `ms-notificacion-audit` disabled and remove/disable gateway routes for
  that service only if the demo depends on clean route behavior.

## CORS and Domains

Development origins:

- `http://localhost`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

Production/staging origins:

- `https://styleandbeauty.me`
- `https://www.styleandbeauty.me`
- `https://<frontend-app>.azurecontainerapps.io`
- `https://<cloudflare-pages>.pages.dev` if Cloudflare Pages remains active

Gateway CORS must allow:

- Methods: `GET,POST,PUT,PATCH,DELETE,OPTIONS`
- Headers: `Authorization,Content-Type` or `*`
- Credentials: true only with explicit origins, never with wildcard `*`
- Bearer tokens in `Authorization`

DNS plan:

- Use Cloudflare or Namecheap DNS.
- Point `styleandbeauty.me` or `www.styleandbeauty.me` to frontend.
- Point `api.styleandbeauty.me` to the gateway public ingress.
- Configure HTTPS certificates through Azure managed certificates or Cloudflare
  proxy, but avoid double TLS confusion during first deployment.

## Azure Container Apps Deployment Outline

1. Create resource group.
2. Create Container Apps Environment.
3. Create PostgreSQL Flexible Server or configure Supabase.
4. Create MongoDB provider only if audit is required.
5. Create secrets:
   - new Firebase Admin JSON
   - DB usernames/passwords
   - Mongo URI
   - basic auth credentials
   - Google Calendar credentials only if enabled
6. Deploy internal microservices with internal ingress or no public ingress.
7. Deploy API Gateway with external ingress.
8. Deploy frontend with external ingress.
9. Configure custom domains and CORS.
10. Validate HTTP flows with real Firebase ID token.

## Pre-Deployment Checklist

Run before deployment:

```powershell
git status --short --branch
docker compose config --quiet
.\scripts\deploy-azure.ps1 -EnvFile .env.azure
```

Backend:

- `mvn test` in each service.
- Verify Java 21 builds.
- Confirm each Dockerfile builds.
- Confirm `ms-extra` and `ms-notificacion-audit` images exist or are excluded.

Frontend:

- `npm run lint`
- `npm run build`
- Confirm `VITE_API_URL=https://<api-domain>/api`.
- Confirm `VITE_USE_MOCKS=false`.

Docker Hub:

- Build and push immutable image tags.
- Do not put secrets in build args except public Firebase web config.
- Avoid relying on `latest` for final demo.

Runtime:

- Health checks green.
- Gateway public endpoint responds.
- Protected endpoints return `401` without token.
- Protected endpoints return expected `200/201` with fresh Firebase token.
- CORS preflight succeeds from final frontend domain.
- Logs have no Firebase Admin, datasource, migration, or pool exhaustion errors.

## Runtime Files and n8n

The current repository has tracked `n8n/n8n_data/*` runtime files. They should
not be part of Azure deployment artifacts. Future runtime files are ignored, but
tracked files remain tracked until intentionally removed from Git history/index.

Recommended cleanup in a dedicated commit:

```powershell
git rm --cached -r n8n/n8n_data
git commit -m "chore: stop tracking n8n runtime data"
```

Do this only after confirming the team does not need any tracked n8n workflow
exports from that folder. Prefer exported workflow JSON files under a dedicated
documentation folder instead of SQLite runtime state.

