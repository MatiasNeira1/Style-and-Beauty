# Plan tecnico de pruebas: microservicio de agendamiento

## Alcance

Este plan valida el flujo real de agenda desde el frontend hasta `ms-agenda`, PostgreSQL y Google Calendar.

Componentes cubiertos:

- Frontend: `BookingPage.jsx`, `DateTimePicker.jsx`, `agendaService.js`.
- Backend: `CitaController`, `CitaService`, `HolguraService`, `GoogleCalendarService`.
- API agenda: `GET /api/agenda/citas`, `GET /api/agenda/citas/{id}`, `POST /api/agenda/citas/disponibilidad`, `POST /api/agenda/citas`, `PATCH /api/agenda/citas/{id}/estado`, `DELETE /api/agenda/citas`.
- PostgreSQL: tabla `citas`, tabla `bloqueos_agenda`, constraint anti-solape `citas_staff_sin_solapamientos`.
- Google Calendar: consulta `freeBusy` y creacion de evento cuando `GOOGLE_CALENDAR_ENABLED=true`.

Reglas de holgura esperadas:

| Categoria | Holgura |
|---|---:|
| Cabello | 30 min |
| Maquillaje | 15 min |
| Nails | 15 min |
| Cuidados de la piel | 20 min |
| Spa | 30 min |

## Datos base

Usar datos reales del ambiente local o staging. No hardcodear estos valores en codigo:

- `idCliente`: cliente autenticado con perfil valido.
- `idStaff`: profesional con jornada activa.
- `idServicioCabello`: servicio de categoria Cabello, duracion 60 min.
- `idServicioMaquillaje`: servicio de categoria Maquillaje, duracion 60 min.
- `idServicioNails`: servicio de categoria Nails, duracion 60 min.
- `idServicioPiel`: servicio de categoria Cuidados de la piel, duracion 60 min.
- `idServicioSpa`: servicio de categoria Spa, duracion 60 min.
- Fecha futura con jornada: `2030-01-07`.
- Jornada recomendada: `09:00-18:00`.
- Zona horaria: `America/Santiago`.

Payload de disponibilidad:

```json
{
  "idStaff": "<UUID_STAFF>",
  "idServicio": "<UUID_SERVICIO>",
  "fecha": "2030-01-07"
}
```

Payload de creacion:

```json
{
  "idCliente": "<UUID_CLIENTE>",
  "idStaff": "<UUID_STAFF>",
  "idServicio": "<UUID_SERVICIO>",
  "fechaHoraInicio": "2030-01-07T09:00:00-03:00",
  "observacionCliente": "Prueba QA"
}
```

## Matriz de pruebas

| ID | Modulo | Precondicion | Pasos | Datos de prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|
| AG-001 | Frontend | Usuario no autenticado | Entrar a `/reservar` | Sin token | Muestra bloqueo de login y no permite reservar | Pendiente | Pendiente | Screenshot |
| AG-002 | Frontend | Usuario autenticado con perfil cliente | Seleccionar servicio, staff y fecha | Servicio Cabello, staff con jornada | Llama `POST /api/agenda/citas/disponibilidad` y muestra slots del backend | Pendiente | Pendiente | Network tab |
| AG-003 | Frontend | Slot visible seleccionado | Confirmar reserva | Slot `09:00` | Reconsulta disponibilidad antes de `POST /api/agenda/citas` | Pendiente | Pendiente | Network tab |
| AG-004 | Frontend | Slot obsoleto por otra reserva | Seleccionar slot, reservarlo en otra sesion, confirmar | Slot `09:00` | Limpia seleccion y muestra error de horario no disponible | Pendiente | Pendiente | Screenshot |
| AG-005 | Backend disponibilidad | Staff con jornada, sin citas | `POST /api/agenda/citas/disponibilidad` | Cabello 60 min | Retorna slots cada 15 min cuyo bloque total 90 min cabe en jornada | Pendiente | Pendiente | Response JSON |
| AG-006 | Backend disponibilidad | Staff sin jornada activa | Consultar disponibilidad | Fecha sin jornada | Retorna `[]` | Pendiente | Pendiente | Response JSON |
| AG-007 | Backend disponibilidad | Cita `10:00-11:00`, holgura hasta `11:30` | Consultar disponibilidad | Cabello 60+30 | No muestra slots que solapen `10:00-11:30`; muestra `11:30` | Pendiente | Pendiente | Response JSON |
| AG-008 | Backend disponibilidad | Cita posterior `12:00-13:00`, holgura hasta `13:30` | Consultar disponibilidad | Cabello 60+30 | No muestra slots cuyo fin con holgura pase de `12:00` | Pendiente | Pendiente | Response JSON |
| AG-009 | Backend creacion | Slot valido sin citas previas | `POST /api/agenda/citas` | Cabello `09:00` | Guarda `09:00-10:00`, fin holgura `10:30`, estado `PENDIENTE_PAGO` | Pendiente | Pendiente | DB row |
| AG-010 | Backend creacion | Cita `09:00-10:00`, holgura `10:30` | Crear cita `10:15` | Cabello | Rechaza por solape con holgura | Pendiente | Pendiente | HTTP response |
| AG-011 | Backend creacion | Cita `09:00-10:00`, holgura `10:30` | Crear cita `10:30` | Cabello | Permite crear exactamente al final del bloque ocupado | Pendiente | Pendiente | DB row |
| AG-012 | Backend validacion | Servicio sin duracion valida | Disponibilidad y creacion | Duracion `0` o null | Rechaza con error de duracion o servicio invalido | Pendiente | Pendiente | HTTP response |
| AG-013 | Backend validacion | Cliente inexistente | Crear cita | `idCliente` invalido | Rechaza con error de cliente no encontrado | Pendiente | Pendiente | HTTP response |
| AG-014 | Backend validacion | Staff inexistente | Disponibilidad y creacion | `idStaff` invalido | Rechaza con error de staff no encontrado | Pendiente | Pendiente | HTTP response |
| AG-015 | Holgura | Servicio Cabello | Crear cita | 60 min | `holguraMin=30`, bloque total 90 min | Pendiente | Pendiente | DB row |
| AG-016 | Holgura | Servicio Maquillaje | Crear cita | 60 min | `holguraMin=15`, bloque total 75 min | Pendiente | Pendiente | DB row |
| AG-017 | Holgura | Servicio Nails | Crear cita | 60 min | `holguraMin=15`, bloque total 75 min | Pendiente | Pendiente | DB row |
| AG-018 | Holgura | Servicio Cuidados de la piel | Crear cita | 60 min | `holguraMin=20`, bloque total 80 min | Pendiente | Pendiente | DB row |
| AG-019 | Holgura | Servicio Spa | Crear cita | 60 min | `holguraMin=30`, bloque total 90 min | Pendiente | Pendiente | DB row |
| AG-020 | PostgreSQL | Constraint anti-solape aplicado | Enviar dos reservas simultaneas al mismo slot | Mismo staff y hora | Solo una cita queda persistida; la otra falla por conflicto | Pendiente | Pendiente | SQL + logs |
| AG-021 | PostgreSQL | Cita creada | Consultar tabla `citas` | `id_cita` generado | Valores de inicio, fin, fin holgura, duracion, holgura y estado coinciden con response | Pendiente | Pendiente | SELECT |
| AG-022 | PostgreSQL | Cita existente | `DELETE /api/agenda/citas/{id}` | Cita activa | Cambia a `CANCELADA`; disponibilidad libera el bloque | Pendiente | Pendiente | DB row |
| AG-023 | Google Calendar | `GOOGLE_CALENDAR_ENABLED=false` | Crear cita | Slot valido | Cita se guarda; `googleCalendarEventId` puede quedar null | Pendiente | Pendiente | DB row |
| AG-024 | Google Calendar | Calendar activo y credenciales validas | Crear cita | Staff con `emailContacto` como calendarId | Crea evento desde inicio hasta fin con holgura y guarda `googleCalendarEventId` | Pendiente | Pendiente | Calendar + DB |
| AG-025 | Google Calendar | Calendar con busy block `09:30-10:30` | Consultar disponibilidad | Cabello | No aparecen slots que solapen el busy block | Pendiente | Pendiente | Response JSON |
| AG-026 | Google Calendar | Credenciales invalidas, `fail-on-error=true` | Consultar disponibilidad o crear cita | Credencial rota | Backend rechaza y no crea cita | Pendiente | Pendiente | HTTP response |
| AG-027 | Google Calendar | Calendar activo, `fail-on-error=false` | Consultar disponibilidad | API Calendar caida | Backend continua sin bloques Calendar; registrar riesgo | Pendiente | Pendiente | Logs |
| AG-028 | Bloqueos agenda | Bloqueo local `14:00-15:00` | Consultar disponibilidad | Cualquier servicio | No muestra slots que solapen bloqueo | Pendiente | Pendiente | Response JSON |
| AG-029 | Estados ignorados | Cita `CANCELADA` en el rango | Consultar disponibilidad | Mismo staff | Cita cancelada no bloquea disponibilidad | Pendiente | Pendiente | Response JSON |
| AG-030 | Admin agenda | Citas existentes | Abrir `/admin/agenda` | Mes actual/futuro | Lista reservas con `agendaService.listBookings()` y permite cambio de estado | Pendiente | Pendiente | Screenshot |
| AG-031 | API estado | Cita existente | `PATCH /api/agenda/citas/{id}/estado` | Estado valido | Actualiza `estadoCita`, `observacionStaff` y registra historial | Pendiente | Pendiente | DB row |
| AG-032 | Zona horaria | Jornada en `America/Santiago` | Consultar fecha local futura | Fecha con offset correspondiente | Slots pertenecen al dia local seleccionado, no al dia UTC | Pendiente | Pendiente | Response JSON |
| AG-033 | Fin jornada | Jornada `09:00-18:00` | Crear cita `17:00` | Cabello 60+30 | Rechaza porque fin con holgura seria `18:30` | Pendiente | Pendiente | HTTP response |
| AG-034 | Fin jornada exacto | Jornada `09:00-18:00` | Crear cita `16:30` | Cabello 60+30 | Permite porque fin con holgura es `18:00` | Pendiente | Pendiente | DB row |
| AG-035 | Contrato API | Payload sin `idServicio` | `POST /api/agenda/citas/disponibilidad` | Campo faltante | Responde `400` de validacion | Pendiente | Pendiente | HTTP response |
| AG-036 | Contrato API | Payload sin `fechaHoraInicio` | `POST /api/agenda/citas` | Campo faltante | Responde `400` de validacion | Pendiente | Pendiente | HTTP response |

## Pruebas manuales

1. Levantar PostgreSQL y microservicios requeridos: `ms-agenda`, `ms-perfiles`, `ms-catalogo` y frontend.
2. Confirmar `APP_AGENDA_ZONE=America/Santiago`.
3. Ejecutar primero con `GOOGLE_CALENDAR_ENABLED=false`.
4. Ejecutar despues con `GOOGLE_CALENDAR_ENABLED=true`, `GOOGLE_CALENDAR_CREDENTIALS_PATH` o `GOOGLE_CALENDAR_CREDENTIALS_JSON`.
5. Compartir el calendario del staff con la service account si se usa `emailContacto` como calendarId.
6. Ejecutar matriz AG-001 a AG-036 y completar columnas de resultado obtenido, estado y evidencia.

SQL de evidencia:

```sql
SELECT id_cita, id_cliente, id_staff, id_servicio,
       fecha_hora_inicio, fecha_hora_fin, fecha_hora_fin_holgura,
       duracion_servicio_min, holgura_min, estado_cita,
       google_calendar_event_id, created_at, updated_at
FROM citas
ORDER BY created_at DESC
LIMIT 20;
```

## Pruebas automatizadas sugeridas

Ya existe cobertura unitaria en:

- `backend/ms-agenda/src/test/java/com/style/beauty/ms_agenda/service/HolguraServiceTest.java`
- `backend/ms-agenda/src/test/java/com/style/beauty/ms_agenda/service/CitaServiceTest.java`

Cobertura sugerida adicional:

- Testcontainers PostgreSQL para probar el constraint `citas_staff_sin_solapamientos` contra PostgreSQL real.
- MockWebServer o WireMock para `GoogleCalendarService` y respuestas reales de `/freeBusy` y `/events`.
- React Testing Library + MSW para `BookingPage.jsx`, especialmente revalidacion antes de confirmar.
- Playwright/Cypress para login, seleccion de slot, confirmacion, navegacion a `/checkout` y doble reserva con dos sesiones.
