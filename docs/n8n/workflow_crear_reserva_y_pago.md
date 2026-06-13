# Workflow n8n - Crear Reserva y Pago

## Webhook De Prueba

```http
POST /webhook/style-beauty/crear-reserva
```

Body:

```json
{
  "idCliente": "UUID_CLIENTE",
  "idStaff": "UUID_STAFF",
  "idServicio": "UUID_SERVICIO",
  "fechaHoraInicio": "2026-06-10T09:00:00-04:00"
}
```

## Nodos

1. Webhook.
2. HTTP Request - Crear cita:

```http
POST {{API_BASE_URL}}/api/agenda/citas
```

```json
{
  "idCliente": "={{$json.idCliente}}",
  "idStaff": "={{$json.idStaff}}",
  "idServicio": "={{$json.idServicio}}",
  "fechaHoraInicio": "={{$json.fechaHoraInicio}}",
  "observacionCliente": "Agendado desde chatbot n8n"
}
```

3. HTTP Request - Crear pago Webpay:

```http
POST {{API_BASE_URL}}/api/pagos/webpay/crear
```

```json
{
  "idCita": "={{$json.idCita}}",
  "descripcion": "Reserva Style and Beauty desde chatbot"
}
```

`ms-pagos` calcula el monto consultando el precio real del servicio en `ms-catalogo`.

4. Set - Armar link de pago:

```text
{{PAYMENT_REDIRECT_BASE_URL}}/{{$json.idTransaccion}}
```

5. Respond to Webhook:

```json
{
  "mensaje": "Tu reserva quedo pendiente de pago. Para confirmarla, paga aqui: LINK",
  "idCita": "UUID_CITA",
  "idTransaccion": "UUID_TRANSACCION",
  "linkPago": "http://localhost:8080/api/pagos/webpay/redirigir/UUID_TRANSACCION"
}
```

## Reglas

- Consultar disponibilidad antes de crear.
- Crear cita solo con un horario real devuelto por backend.
- No confirmar verbalmente la cita antes de pago aprobado.
- El link de pago debe ser el endpoint `/redirigir/{idTransaccion}`.
- No enviar `window.location.href`, iframe ni token Webpay directo al cliente.
