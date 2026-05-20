# Style-and-Beauty

## Despliegue con Docker

Levantar toda la arquitectura:

```bash
docker compose up --build
```

Servicios publicados:

- API Gateway: http://localhost:8080
- Swagger centralizado: http://localhost:8080/swagger-ui.html

La base de datos PostgreSQL queda disponible en `localhost:5432` con:

- Database: `style_beauty`
- User: `postgres`
- Password: `postgres`

MongoDB para notificaciones y auditoria queda disponible en `localhost:27017` con la base:

- Database: `style_beauty_audit`
