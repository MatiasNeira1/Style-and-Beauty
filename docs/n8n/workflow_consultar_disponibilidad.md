# Workflow n8n - Consultar Disponibilidad

## Objetivo

Consultar horarios reales disponibles desde `ms-agenda` usando siempre API Gateway.

## Endpoint

```http
POST {{API_BASE_URL}}/api/agenda/citas/disponibilidad
Content-Type: application/json
```

Body:

```json
{
  "idStaff": "UUID_STAFF",
  "idServicio": "UUID_SERVICIO",
  "fecha": "2026-06-10"
}
```

## Nodos

1. Webhook o AI Agent Tool.
2. HTTP Request `consultarDisponibilidad`.
3. Code o Set para limitar a maximo 5 horarios visibles.
4. Responder al cliente con hora inicio y fin visible.

## Reglas

- No inventar horarios.
- No mostrar `holguraMin`.
- No mostrar `fechaHoraFinAtencion`.
- Si no hay horarios, pedir otra fecha o profesional.
- El agente debe validar que el horario elegido por el cliente exista en esta respuesta antes de crear la cita.
