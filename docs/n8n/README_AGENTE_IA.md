# Style and Beauty - Agente IA n8n

## Base URL

Si n8n corre localmente fuera de Docker:

```env
API_BASE_URL=http://localhost:8080
FRONTEND_BASE_URL=http://localhost:5173
PAYMENT_REDIRECT_BASE_URL=http://localhost:8080/api/pagos/webpay/redirigir
```

Si n8n corre en Docker:

```env
API_BASE_URL=http://host.docker.internal:8080
FRONTEND_BASE_URL=http://host.docker.internal:5173
PAYMENT_REDIRECT_BASE_URL=http://host.docker.internal:8080/api/pagos/webpay/redirigir
```

No consumir directamente `8083`, `8084`, `8085` o `8086` desde n8n. El contrato local para automatizaciones debe pasar por el API Gateway.

## System Prompt

```text
Eres el asistente virtual de Style and Beauty. Tu funcion es ayudar a clientes a consultar servicios, ver disponibilidad, reservar horas, cancelar reservas y obtener links de pago. No puedes inventar horarios, precios, profesionales ni confirmaciones. Siempre debes usar las herramientas disponibles para consultar informacion real del backend. Una reserva solo queda confirmada cuando el pago Webpay es aprobado. Si falta informacion, debes pedirla de forma clara y breve. No debes mostrar informacion interna como holgura, fin real de atencion o datos tecnicos. Debes responder de forma amable, simple y profesional.
```

## Herramientas HTTP Del Agente

- `consultarServicios`: `GET {{API_BASE_URL}}/api/servicio`
- `consultarStaffPorServicio`: `GET {{API_BASE_URL}}/api/agenda/servicios/{idServicio}/staff`
- `consultarDisponibilidad`: `POST {{API_BASE_URL}}/api/agenda/citas/disponibilidad`
- `crearCita`: `POST {{API_BASE_URL}}/api/agenda/citas`
- `crearPagoCarritoWebpay`: `POST {{API_BASE_URL}}/api/pagos/webpay/crear`
- `consultarCitasCliente`: `GET {{API_BASE_URL}}/api/agenda/clientes/{idCliente}/citas`
- `cancelarCita`: `PATCH {{API_BASE_URL}}/api/agenda/citas/{idCita}/cancelar`
- `consultarEstadoCita`: `GET {{API_BASE_URL}}/api/agenda/citas/{idCita}`

## Bodies Principales

Crear cita:

```json
{
  "idCliente": "UUID_CLIENTE",
  "idStaff": "UUID_STAFF",
  "idServicio": "UUID_SERVICIO",
  "fechaHoraInicio": "2026-06-10T09:00:00-04:00",
  "observacionCliente": "Agendado desde chatbot n8n"
}
```

Crear pago Webpay desde carrito:

```json
{
  "idCliente": "UUID_CLIENTE",
  "descripcion": "Carrito Style and Beauty desde chatbot",
  "reservas": [
    {
      "idCita": "UUID_CITA"
    }
  ],
  "productos": [
    {
      "idProducto": "UUID_O_SKU_PRODUCTO",
      "nombre": "Producto",
      "precio": 12990,
      "cantidad": 1
    }
  ]
}
```

El monto de reservas lo calcula `ms-pagos` consultando el precio real del servicio en `ms-catalogo`.
Los productos se pagan como items del mismo carrito.

## Reglas Operativas

- Consultar disponibilidad antes de crear una cita.
- Validar que el horario elegido exista en la respuesta real de disponibilidad.
- Ofrecer como maximo 5 horarios al cliente.
- No inventar horarios, precios, profesionales ni confirmaciones.
- La cita queda `PENDIENTE_PAGO` al crearla.
- Webpay solo se inicia con el carrito completo, no desde una reserva aislada.
- Solo decir que esta confirmada cuando Webpay apruebe el pago.
- Enviar al cliente el link: `{{PAYMENT_REDIRECT_BASE_URL}}/{idTransaccion}`.
- No mostrar `holguraMin`, `fechaHoraFinAtencion` ni datos tecnicos al cliente.
- Para cancelar, primero consultar las citas del cliente y pedir que elija una.
- No cancelar citas `FINALIZADA`.

## Google Calendar

Google Calendar es solo visualizacion para el staff. La disponibilidad sigue siendo propiedad de `ms-agenda`.

Variables recomendadas en `ms-agenda`:

```env
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_FAIL_ON_ERROR=false
GOOGLE_CALENDAR_CREDENTIALS_PATH=/run/secrets/google-calendar-service-account.json
GOOGLE_CALENDAR_DEFAULT_TIME_ZONE=America/Santiago
```

No subir credenciales reales al repositorio. En local, deja el JSON fuera del repo y apunta `GOOGLE_CALENDAR_CREDENTIALS_PATH` a esa ruta.

Configurar calendario por staff:

```http
POST http://localhost:8080/api/agenda/staff/{idStaff}/calendar-config
Content-Type: application/json

{
  "calendarId": "staff-calendar@example.com",
  "activo": true
}
```
