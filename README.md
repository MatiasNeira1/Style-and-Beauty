# Style-and-Beauty

Monorepo con frontend React/Vite y backend Spring Boot por microservicios.

## Produccion

- Frontend: Cloudflare Pages desde `frontend/`
- API publica: `https://api.midominio.com`
- Backend: DigitalOcean Ubuntu + Docker Compose + Nginx
- DNS/SSL: Cloudflare DNS y SSL/TLS

## Cloudflare Pages

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Node version: `22`

Variables:

```env
VITE_API_URL=https://api.midominio.com
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Backend Docker

```bash
cp .env.example .env
docker compose --env-file .env up -d --build
docker compose ps
docker compose logs -f api-gateway
```

El gateway se publica solo en `127.0.0.1:8080`. PostgreSQL y MongoDB quedan privados en la red Docker.

## Nginx

Usar `deploy/nginx/api.style-beauty.conf` como base:

```bash
sudo cp deploy/nginx/api.style-beauty.conf /etc/nginx/sites-available/api.style-beauty.conf
sudo ln -s /etc/nginx/sites-available/api.style-beauty.conf /etc/nginx/sites-enabled/api.style-beauty.conf
sudo nginx -t
sudo systemctl reload nginx
```

## DNS

- `midominio.com`: CNAME al proyecto de Cloudflare Pages.
- `www.midominio.com`: CNAME al proyecto de Cloudflare Pages.
- `api.midominio.com`: A hacia la IP publica del droplet, proxy Cloudflare activo.

## Seguridad

- No commitear `.env`, service accounts ni llaves privadas.
- Rotar cualquier secreto que haya estado versionado.
- En produccion usar `APP_CORS_ALLOWED_ORIGINS=https://midominio.com,https://www.midominio.com`.
