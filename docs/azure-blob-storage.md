# Azure Blob Storage para imagenes

## Alcance

La integracion permite subir, reemplazar y eliminar imagenes desde backend. El frontend nunca recibe Storage Keys, Connection Strings ni SAS Tokens.

Los archivos se guardan en Azure Blob Storage y PostgreSQL guarda solo la URL resultante.

## Variables requeridas

Configurar estas variables en los microservicios que administran imagenes:

- `AZURE_STORAGE_CONNECTION_STRING`: secreto de Azure Storage.
- `AZURE_STORAGE_CONTAINER`: `stylebeauty`.

Tambien deben mantenerse las variables normales de base de datos y runtime:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_CORS_ALLOWED_ORIGINS`
- `TZ`
- `APP_AGENDA_ZONE`

## Contenedor y carpetas

Contenedor esperado:

- `stylebeauty`

Carpetas logicas usadas:

- `profesionales/`
- `servicios/`
- `productos/`

Reservadas para ampliacion:

- `staff/`
- `logos/`
- `galeria/`

## Validaciones

`AzureBlobStorageService` valida:

- JPG, JPEG, PNG o WEBP.
- Maximo 5 MB.
- Archivo no vacio.
- Nombre seguro sin espacios/caracteres problematicos.
- UUID en cada nombre para evitar colisiones.

## Endpoints

### Profesionales / Staff

- `POST /api/profesionales/{id}/foto`
- `DELETE /api/profesionales/{id}/foto`

Alias admin:

- `POST /api/admin/staff/{id}/foto`
- `DELETE /api/admin/staff/{id}/foto`
- `PATCH /api/profesionales/{id}/estado/{activo}`
- `PATCH /api/admin/staff/{id}/estado/{activo}`

### Servicios

- `POST /api/servicios/{id}/imagen`
- `DELETE /api/servicios/{id}/imagen`

Alias compatible:

- `POST /api/servicio/{id}/imagen`
- `DELETE /api/servicio/{id}/imagen`

### Productos

- `POST /api/productos/{id}/imagen`
- `DELETE /api/productos/{id}/imagen`

Alias compatible:

- `POST /api/v1/inventarios/productos/{id}/imagen`
- `DELETE /api/v1/inventarios/productos/{id}/imagen`

## Flujo de subida/reemplazo

1. El admin selecciona la imagen en React.
2. El frontend envia `multipart/form-data` con campo `file`.
3. Backend valida archivo.
4. Backend elimina el blob anterior si existia.
5. Backend sube el nuevo blob en la carpeta correspondiente.
6. Backend guarda la URL en PostgreSQL.
7. Backend retorna la entidad actualizada.

## Flujo de eliminacion

1. Backend busca la entidad.
2. Si existe URL, elimina el blob.
3. Limpia la URL en PostgreSQL.
4. Retorna la entidad actualizada.

## Archivos modificados principales

- `backend/ms-perfiles`: fotos de staff/profesionales.
- `backend/ms-catalogo`: imagenes de servicios.
- `backend/ms-inventario`: imagenes de productos.
- `backend/Api-gateway/src/main/resources/application.properties`: rutas `/api/profesionales/**`, `/api/servicios/**`, `/api/productos/**`.
- `frontend/src/pages/admin/StaffAdminPage.jsx`
- `frontend/src/pages/admin/ServicesAdminPage.jsx`
- `frontend/src/pages/admin/InventoryAdminPage.jsx`
- `frontend/src/services/*Service.js`

## Build y publicacion Docker

Validar localmente:

```bash
npm run build
mvn -f backend/ms-catalogo/pom.xml test
mvn -f backend/ms-perfiles/pom.xml test
mvn -f backend/ms-inventario/pom.xml test
mvn -f backend/Api-gateway/pom.xml test
mvn -f backend/ms-agenda/pom.xml test
docker compose build api-gateway ms-auth ms-perfiles ms-catalogo ms-agenda ms-inventario ms-pagos ms-notificacion-audit frontend
```

Publicar imagenes:

```bash
docker push watoncitoxx/style-and-beauty-gateway:latest
docker push watoncitoxx/style-and-beauty-auth:latest
docker push watoncitoxx/style-and-beauty-perfiles:latest
docker push watoncitoxx/style-and-beauty-catalogo:latest
docker push watoncitoxx/style-and-beauty-agenda:latest
docker push watoncitoxx/style-and-beauty-inventario:latest
docker push watoncitoxx/style-and-beauty-pagos:latest
docker push watoncitoxx/style-and-beauty-notificacion-audit:latest
```

Antes de publicar, revisar que las imagenes no incluyan `.env`, service-account JSON, connection strings ni archivos temporales.

## Azure Container Apps

Configurar secretos/variables:

- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_CONTAINER=stylebeauty`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_CORS_ALLOWED_ORIGINS`
- `TZ=America/Santiago`
- `APP_AGENDA_ZONE=America/Santiago`

Modo ahorro entorno TEST:

```bash
az containerapp update --name <app-name> --resource-group <rg> --min-replicas 0 --max-replicas 1
```

Revisar logs:

```bash
az containerapp logs show --name <app-name> --resource-group <rg> --follow
```
