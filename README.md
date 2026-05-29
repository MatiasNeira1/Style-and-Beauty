# Style-and-Beauty

Monorepo con frontend React/Vite y backend Spring Boot por microservicios.

## Arquitectura de produccion

- Frontend: Cloudflare Pages desde `frontend/`
- API publica: `https://api.midominio.com`
- Backend: DigitalOcean Ubuntu + Docker Compose + Nginx reverse proxy
- DNS/SSL: Cloudflare DNS y SSL/TLS
- Base de datos: PostgreSQL master/replica y MongoDB en red Docker privada

## Frontend en Cloudflare Pages

Configuracion del proyecto:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `22`

Variables de entorno en Cloudflare Pages:

```env
VITE_API_URL=https://api.midominio.com
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

El archivo `frontend/public/_redirects` habilita rutas SPA de React Router. El archivo `frontend/public/_headers` agrega headers basicos de seguridad y cache immutable para assets.

## Backend en DigitalOcean

1. Instalar Docker Engine, Docker Compose plugin y Nginx en Ubuntu.
2. Copiar `.env.example` a `.env` en la raiz del repo y reemplazar todos los valores `replace_with...`.
3. Configurar dominios reales:

```env
API_GATEWAY_PORT=8080
APP_CORS_ALLOWED_ORIGINS=https://midominio.com,https://www.midominio.com
FIREBASE_SERVICE_ACCOUNT_PATH=/run/secrets/firebase-service-account.json
```

4. Levantar el backend:

```bash
docker compose --env-file .env up -d --build
docker compose ps
docker compose logs -f api-gateway
```

El gateway queda publicado solo en `127.0.0.1:8080`; PostgreSQL y MongoDB no se exponen al exterior.

## Nginx reverse proxy

Usar `deploy/nginx/api.style-beauty.conf` como base:

```bash
sudo cp deploy/nginx/api.style-beauty.conf /etc/nginx/sites-available/api.style-beauty.conf
sudo ln -s /etc/nginx/sites-available/api.style-beauty.conf /etc/nginx/sites-enabled/api.style-beauty.conf
sudo nginx -t
sudo systemctl reload nginx
```

Cloudflare debe apuntar `api.midominio.com` al droplet. En SSL/TLS usar `Full` o `Full (strict)` si instalas un Origin Certificate en Nginx.

## DNS recomendado

- `midominio.com` CNAME hacia el host asignado por Cloudflare Pages.
- `www.midominio.com` CNAME hacia el mismo proyecto de Cloudflare Pages.
- `api.midominio.com` A hacia la IP publica del droplet DigitalOcean, con proxy naranja activado en Cloudflare.

## Operacion

```bash
docker compose config
docker compose up -d --build
docker compose logs -f api-gateway
docker compose logs -f ms-agenda
docker compose down
```

Para validar API:

```bash
curl -I http://127.0.0.1:8080/swagger-ui.html
curl -I https://api.midominio.com/swagger-ui.html
```

## Seguridad

- No commitear `.env`, `.env.local`, service accounts, llaves privadas ni builds.
- Rotar cualquier secreto que haya sido committeado antes de esta limpieza.
- Mantener `APP_CORS_ALLOWED_ORIGINS` solo con dominios HTTPS productivos en el servidor.
- Evitar publicar puertos de base de datos; el compose productivo usa red Docker privada.

## Notas

El frontend usa una unica variable `VITE_API_URL`. Si agregas nuevos servicios, enruta por el API Gateway y no agregues URLs publicas por microservicio al navegador.
