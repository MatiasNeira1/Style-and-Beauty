# Style-and-Beauty

Sistema de salon con microservicios Spring Boot, frontend React/Vite, PostgreSQL con replica y MongoDB para auditoria/notificaciones.

## Ejecucion local

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend agenda con Java 21:

```powershell
cd backend/ms-agenda
$env:JAVA_HOME='C:\Program Files\Amazon Corretto\jdk21.0.11_10'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
./mvnw.cmd test
./mvnw.cmd spring-boot:run
```

En Linux/macOS:

```bash
cd backend/ms-agenda
export JAVA_HOME=/path/to/jdk-21
./mvnw test
./mvnw spring-boot:run
```

## Despliegue Docker en Ubuntu

1. Instalar Docker Engine y el plugin Compose.
2. Copiar `.env.example` a `.env` y reemplazar todas las contrasenas `replace_with...`.
3. Levantar el stack:

```bash
docker compose --env-file .env up -d --build
```

Servicios publicados por defecto:

- Frontend Nginx: `http://SERVIDOR/`
- API Gateway: `http://SERVIDOR:8080`
- PostgreSQL master: `SERVIDOR:5432`
- PostgreSQL replica: `SERVIDOR:5433`
- MongoDB: `SERVIDOR:27017`

Comandos operativos:

```bash
docker compose ps
docker compose logs -f ms-agenda
docker compose down
docker compose up -d --build
docker compose build --no-cache ms-agenda frontend
```

## PostgreSQL master-replica

El `docker-compose.yml` usa `postgres-master` y `postgres-replica` con volumen persistente separado y usuario de replicacion por variables de entorno.

Validar replicacion:

```bash
docker compose exec postgres-master psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE TABLE IF NOT EXISTS replication_check(id serial primary key, created_at timestamptz default now()); INSERT INTO replication_check DEFAULT VALUES;"
docker compose exec postgres-replica psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT * FROM replication_check ORDER BY id DESC LIMIT 5;"
docker compose exec postgres-master psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT client_addr, state, sync_state FROM pg_stat_replication;"
docker compose exec postgres-replica psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT pg_is_in_recovery();"
```

La replica debe devolver `pg_is_in_recovery = t` y ver la fila insertada en el master.

## Guard de solapamientos en agenda

Despues de que Hibernate cree/actualice la tabla `citas`, ejecutar una vez en PostgreSQL productivo:

```bash
docker compose exec -T postgres-master psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < backend/ms-agenda/src/main/resources/db/manual/V20260527__agenda_holgura_overlap_guard.sql
```

Ese script agrega extension `btree_gist`, columnas faltantes si existieran datos antiguos, indice y restriccion exclusion para impedir solapamientos activos por staff a nivel base de datos.

## Validaciones de agenda

La disponibilidad y la creacion de citas consultan `ms-catalogo` para obtener la duracion real del servicio y calcular la holgura en backend. El frontend no decide la holgura.

Reglas aplicadas:

- Manicure/manicura: 15 min.
- Mechas, botox, alisado y tinturas: 30 min.
- Corte de pelo, peinados e hidratacion capilar: 10 min.
- Cuidados de la piel/faciales/estetica: 10 min.
- Masajes: 20 min.
- Maquillajes: 15 min.
- Maquillaje de novia: 30 min.

Pruebas ejecutadas:

```powershell
cd backend/ms-agenda
$env:JAVA_HOME='C:\Program Files\Amazon Corretto\jdk21.0.11_10'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
./mvnw.cmd test

cd ../../frontend
npm run build

cd ..
docker compose config
```
