# Workflow n8n - Cancelar Cita

## Objetivo

Permitir que el agente IA cancele una cita activa sin borrar registros fisicamente.

## Paso 1: Consultar Citas Del Cliente

```http
GET {{API_BASE_URL}}/api/agenda/clientes/{idCliente}/citas?desde=2026-06-10&hasta=2026-06-17
```

El agente debe mostrar opciones simples al cliente, sin exponer UUIDs salvo que sea necesario para soporte.

## Paso 2: Cancelar Cita Elegida

```http
PATCH {{API_BASE_URL}}/api/agenda/citas/{idCita}/cancelar
Content-Type: application/json
```

Body:

```json
{
  "motivo": "Cancelado por cliente desde chatbot n8n"
}
```

## Reglas

- Solo cancelar citas `CONFIRMADA` o `PENDIENTE_PAGO`.
- No cancelar citas `FINALIZADA`.
- Si la cita ya esta `CANCELADA`, `RECHAZADA` o `EXPIRADA`, informar que ya no esta activa.
- No borrar la cita de la base de datos.
- Si existe evento en Google Calendar, el backend debe eliminarlo o actualizarlo.
- Registrar historial de cancelacion en backend.
