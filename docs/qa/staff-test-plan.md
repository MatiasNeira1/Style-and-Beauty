# Plan tecnico de pruebas: staff y panel de staff

## Alcance

Este plan valida solo funcionalidades relacionadas con staff, tanto desde administracion como desde el portal propio del profesional.

Componentes cubiertos:

- Frontend admin: `StaffAdminPage.jsx`, `StaffFormModal.jsx`, `StaffProfileCard.jsx`, `StaffWorkSchedule.jsx`, `StaffPortfolioGallery.jsx`, `StaffDeleteDialog.jsx`.
- Frontend staff: `StaffPortalPage.jsx`, `StaffDashboard.jsx`, `StaffPortalProfile.jsx`.
- Servicios frontend: `staffService.js`, `agendaService.js`, `profileService.js`, `serviceCatalogService.js`.
- Backend perfiles: `AdminController`, `PerfilController`, `PerfilService`.
- Backend agenda: `CitaController`, `JornadaStaffController`.
- Backend catalogo: `ServicioStaffController`.
- Rutas principales: `/admin/staff`, `/staff`, `/profesionales`, flujo de reserva con seleccion de profesional.

Fuera de alcance:

- Flujo completo de pago Webpay.
- CRUD completo de servicios, inventario, clientes y agenda admin, salvo integraciones necesarias para validar staff.
- Solicitud de vacaciones, porque actualmente es una vista placeholder/proximamente.

## Roles y permisos

Roles requeridos:

- `ADMIN`: puede entrar a `/admin/staff`, crear/editar/eliminar staff, cambiar foto, administrar jornada y portfolio.
- `STAFF`: puede entrar a `/staff`, revisar dashboard/agenda/historial, editar su perfil, ver jornada, editar bio y portfolio propio, finalizar sus citas.
- `CLIENTE`: no debe entrar a `/admin/staff` ni `/staff`.
- Usuario no autenticado: debe ser redirigido/bloqueado por autenticacion.

Endpoints principales:

| Area | Endpoint |
|---|---|
| Listado admin staff | `GET /api/admin/staff` |
| Crear staff | `POST /api/admin/crear` |
| Editar staff por admin | `PUT /api/admin/actualizar/{idAuthTarget}` |
| Eliminar staff | `DELETE /api/admin/eliminar/{idAuthTarget}` |
| Foto staff | `POST /api/profesionales/{idStaff}/foto`, `DELETE /api/profesionales/{idStaff}/foto` |
| Staff publico | `GET /api/perfiles/staff`, `GET /api/perfiles/staff/{idStaff}` |
| Especialidades | `GET /api/perfiles/especialidades` |
| Perfil propio | `GET /api/perfiles/me`, `PUT /api/perfiles/actualizar` |
| Portfolio | `GET/POST /api/perfiles/staff/{idStaff}/portfolio`, `DELETE /api/perfiles/staff/{idStaff}/portfolio/{idFoto}` |
| Jornada | `GET /api/agenda/jornadas/staff/{idStaff}`, `PUT /api/agenda/jornadas/staff/{idStaff}` |
| Citas staff | `GET /api/agenda/citas/mis-citas`, `PATCH /api/agenda/citas/mis-citas/{id}/finalizar` |
| Servicios asociados | `GET /api/servicio/{idServicio}/staff`, `POST /api/servicio-staff`, `DELETE /api/servicio/{idServicio}/staff/{idStaff}` |

## Datos base

Preparar estos datos antes de ejecutar:

- Usuario Firebase con rol `ADMIN`.
- Usuario Firebase con rol `STAFF` y perfil staff asociado.
- Usuario Firebase con rol `CLIENTE`.
- Al menos 3 especialidades activas.
- Al menos 2 servicios activos en catalogo.
- Un staff activo con foto, jornada y portfolio.
- Un staff activo sin foto, sin jornada y sin portfolio.
- Un staff inactivo, si el backend/datos lo permiten.
- Citas asignadas al staff en estos estados: `PENDIENTE`, `CONFIRMADA`, `EN_ATENCION`, `FINALIZADA`, `CANCELADA`.
- Pagos aprobados asociados a algunas citas del staff para validar graficos de ganancias.
- Imagenes de prueba: JPG valida menor a 5 MB, PNG valida menor a 5 MB, WebP valida menor a 5 MB, PDF invalido, imagen mayor a 5 MB.

Payload base para crear staff:

```json
{
  "rut": "12.345.678-5",
  "nombre": "Valentina",
  "apellidos": "Rojas Soto",
  "fechaNacimiento": "1995-04-10",
  "genero": "FEMENINO",
  "telefono": "+56 9 1234 5678",
  "emailContacto": "staff.qa@example.com",
  "idEspecialidad": 1,
  "descripcionPerfil": "Perfil QA staff",
  "experienciaAnios": 4,
  "idAuth": "<UID_FIREBASE_STAFF>",
  "tipoPerfil": "STAFF"
}
```

Payload base para jornada:

```json
[
  { "diaSemana": 1, "horaInicio": "09:00", "horaFin": "18:00", "activo": true },
  { "diaSemana": 2, "horaInicio": "09:00", "horaFin": "18:00", "activo": true },
  { "diaSemana": 3, "horaInicio": "09:00", "horaFin": "18:00", "activo": true },
  { "diaSemana": 4, "horaInicio": "09:00", "horaFin": "18:00", "activo": true },
  { "diaSemana": 5, "horaInicio": "09:00", "horaFin": "18:00", "activo": true },
  { "diaSemana": 6, "horaInicio": "10:00", "horaFin": "14:00", "activo": false },
  { "diaSemana": 7, "horaInicio": "10:00", "horaFin": "14:00", "activo": false }
]
```

## Matriz de pruebas funcionales

| ID | Modulo | Precondicion | Pasos | Datos de prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|
| ST-001 | Acceso admin | Usuario sin sesion | Entrar a `/admin/staff` | Sin token | Sistema bloquea la ruta y solicita login | Pendiente | Pendiente | Screenshot |
| ST-002 | Acceso admin | Usuario `CLIENTE` | Entrar a `/admin/staff` | Token cliente | Acceso denegado; no carga datos admin | Pendiente | Pendiente | Screenshot + Network |
| ST-003 | Acceso admin | Usuario `STAFF` | Entrar a `/admin/staff` | Token staff | Acceso denegado; no carga `GET /api/admin/staff` exitoso | Pendiente | Pendiente | Screenshot + Network |
| ST-004 | Acceso admin | Usuario `ADMIN` | Entrar a `/admin/staff` | Token admin | Carga panel Equipo profesional, KPIs y tabla de staff | Pendiente | Pendiente | Screenshot |
| ST-005 | Listado admin | Existen staff | Revisar tabla | Staff con y sin foto | Muestra nombre, email, telefono, especialidad y estado | Pendiente | Pendiente | Screenshot |
| ST-006 | Listado admin | `GET /api/admin/staff` falla | Simular API caida/error | 500 o gateway offline | Muestra alerta de error sin romper la pagina | Pendiente | Pendiente | Screenshot |
| ST-007 | Filtro admin | Existen varios staff | Buscar por nombre | Texto parcial con mayus/minus | Tabla muestra coincidencias sin importar mayusculas | Pendiente | Pendiente | Screenshot |
| ST-008 | Filtro admin | Existen especialidades | Buscar por especialidad | Nombre especialidad | Tabla muestra staff de esa especialidad | Pendiente | Pendiente | Screenshot |
| ST-009 | Filtro admin | Existen activos/inactivos | Filtrar `Activos` e `Inactivos` | Estado | Tabla respeta filtro y permite limpiar filtros | Pendiente | Pendiente | Screenshot |
| ST-010 | Crear staff | Admin autenticado | Abrir "Agregar profesional" | Sin datos | Modal Nuevo Profesional muestra campos esperados | Pendiente | Pendiente | Screenshot |
| ST-011 | Crear staff validacion | Modal abierto | Guardar vacio | Campos vacios | Valida RUT, nombre, email, password, especialidad y foto/sin imagen | Pendiente | Pendiente | Screenshot |
| ST-012 | Crear staff validacion | Modal abierto | Ingresar email invalido | `correo-invalido` | Muestra error "Email invalido" y no llama API | Pendiente | Pendiente | Network |
| ST-013 | Crear staff validacion | Modal abierto | Password menor a 6 | `12345` | Muestra error de contrasena minima | Pendiente | Pendiente | Screenshot |
| ST-014 | Crear staff validacion | Modal abierto | Telefono invalido | `abc123` | Muestra error de formato esperado | Pendiente | Pendiente | Screenshot |
| ST-015 | Crear staff validacion | Modal abierto | Experiencia negativa | `-1` | Muestra error y no permite guardar | Pendiente | Pendiente | Screenshot |
| ST-016 | Crear staff foto | Modal abierto | Subir PDF como foto | `archivo.pdf` | Rechaza tipo y muestra "Solo se permiten imagenes JPG, PNG o WEBP" | Pendiente | Pendiente | Screenshot |
| ST-017 | Crear staff foto | Modal abierto | Subir imagen > 5 MB | JPG grande | Rechaza por tamano maximo | Pendiente | Pendiente | Screenshot |
| ST-018 | Crear staff sin foto | Modal abierto | Marcar "Sin imagen por ahora" y guardar datos validos | Payload valido | Crea usuario auth, crea perfil staff y cierra modal | Pendiente | Pendiente | Network + DB |
| ST-019 | Crear staff con foto | Modal abierto | Cargar JPG valido y guardar | Imagen < 5 MB | Crea auth/perfil y luego sube foto del staff | Pendiente | Pendiente | Network + Screenshot |
| ST-020 | Crear staff duplicado | Email/RUT ya existe | Guardar nuevo staff duplicado | Email o RUT repetido | Backend rechaza y modal muestra mensaje de error | Pendiente | Pendiente | Response |
| ST-021 | Detalle admin | Staff listado | Click en fila | Staff valido | Abre modal Detalle profesional en tab Perfil | Pendiente | Pendiente | Screenshot |
| ST-022 | Detalle admin perfil | Modal detalle abierto | Revisar datos | Staff completo | Muestra informacion personal, contacto, especialidad y bio | Pendiente | Pendiente | Screenshot |
| ST-023 | Editar staff admin | Modal detalle abierto | Click Editar, modificar telefono y especialidad | Datos validos | `PUT /api/admin/actualizar/{idAuth}` actualiza y tabla refresca | Pendiente | Pendiente | Network + Screenshot |
| ST-024 | Editar staff admin | Modal editar abierto | Cancelar | Datos modificados sin guardar | Cierra modal sin persistir cambios | Pendiente | Pendiente | Screenshot |
| ST-025 | Cambiar foto admin | Staff con/sin foto | Usar "Cambiar foto" | PNG valido | `POST /api/profesionales/{idStaff}/foto` actualiza foto | Pendiente | Pendiente | Network + Screenshot |
| ST-026 | Eliminar foto admin | Staff con foto | Click "Eliminar foto" | Foto existente | `DELETE /api/profesionales/{idStaff}/foto` elimina y avatar vuelve a iniciales | Pendiente | Pendiente | Network + Screenshot |
| ST-027 | Eliminar foto admin | Staff sin foto | Revisar boton eliminar foto | Sin foto | Boton deshabilitado o no ejecuta accion | Pendiente | Pendiente | Screenshot |
| ST-028 | Jornada admin | Staff seleccionado | Abrir tab Jornada | Staff con jornada | Muestra dias, horas y checkboxes editables | Pendiente | Pendiente | Screenshot |
| ST-029 | Jornada admin | Staff seleccionado | Cambiar lunes a `10:00-17:00` y guardar | Horario valido | `PUT /api/agenda/jornadas/staff/{idStaff}` persiste cambio | Pendiente | Pendiente | Network + DB |
| ST-030 | Jornada admin | Staff seleccionado | Configurar inicio mayor/igual a fin | `18:00-09:00` o `09:00-09:00` | UI muestra error y no llama API | Pendiente | Pendiente | Screenshot + Network |
| ST-031 | Jornada admin | Staff seleccionado | Desactivar un dia y guardar | Martes inactivo | Dia queda inactivo y no deberia ofrecer disponibilidad publica | Pendiente | Pendiente | Network + reserva |
| ST-032 | Jornada admin | Staff seleccionado | Guardar con staffId invalido | Staff sin UUID valido | Muestra error "Selecciona un profesional valido..." | Pendiente | Pendiente | Screenshot |
| ST-033 | Portfolio admin | Staff seleccionado | Abrir tab Portfolio | Staff sin imagenes | Muestra estado vacio y zona de carga | Pendiente | Pendiente | Screenshot |
| ST-034 | Portfolio admin | Tab Portfolio | Subir JPG/PNG/WebP validos | Imagenes < 5 MB | Muestra preview, sube cada imagen y refresca galeria | Pendiente | Pendiente | Network + Screenshot |
| ST-035 | Portfolio admin | Tab Portfolio | Arrastrar archivo invalido | PDF | Rechaza con mensaje por tipo | Pendiente | Pendiente | Screenshot |
| ST-036 | Portfolio admin | Tab Portfolio | Subir imagen > 5 MB | Imagen grande | Rechaza con mensaje por tamano | Pendiente | Pendiente | Screenshot |
| ST-037 | Portfolio admin | Imagen existente | Eliminar imagen | `idFoto` valido | `DELETE /api/perfiles/staff/{idStaff}/portfolio/{idFoto}` elimina imagen | Pendiente | Pendiente | Network + Screenshot |
| ST-038 | Eliminar staff | Staff existente | Abrir eliminar | Staff valido | Modal advierte eliminacion de perfil, jornada y fotos | Pendiente | Pendiente | Screenshot |
| ST-039 | Eliminar staff | Modal eliminar abierto | Cancelar | Staff valido | No elimina y vuelve al detalle/listado | Pendiente | Pendiente | Screenshot |
| ST-040 | Eliminar staff | Modal eliminar abierto | Confirmar | Staff valido | `DELETE /api/admin/eliminar/{idAuth}` elimina y refresca lista | Pendiente | Pendiente | Network + DB |
| ST-041 | Portal staff acceso | Usuario sin sesion | Entrar a `/staff` | Sin token | Sistema bloquea la ruta y solicita login | Pendiente | Pendiente | Screenshot |
| ST-042 | Portal staff acceso | Usuario `CLIENTE` | Entrar a `/staff` | Token cliente | Acceso denegado | Pendiente | Pendiente | Screenshot |
| ST-043 | Portal staff acceso | Usuario `STAFF` | Entrar a `/staff` | Token staff | Carga Staff Center con menu lateral y dashboard | Pendiente | Pendiente | Screenshot |
| ST-044 | Portal staff perfil inexistente | Staff auth sin perfil | Entrar a `/staff` | Token sin perfil asociado | Muestra "Perfil no encontrado" y boton cerrar sesion | Pendiente | Pendiente | Screenshot |
| ST-045 | Portal staff navegacion | Portal cargado | Cambiar entre Dashboard, Agenda, Historial, Perfil, Jornada, Portfolio | Tabs menu | Cambia vista y actualiza query param `view` cuando corresponde | Pendiente | Pendiente | Screenshot |
| ST-046 | Portal staff responsive | Portal cargado | Colapsar/abrir sidebar | Boton menu | Sidebar cambia estado sin romper layout | Pendiente | Pendiente | Screenshot desktop/mobile |
| ST-047 | Portal staff logout | Portal cargado | Click cerrar sesion | Token staff | Cierra sesion y bloquea rutas protegidas | Pendiente | Pendiente | Screenshot |
| ST-048 | Dashboard staff | Staff con citas | Abrir Dashboard | Citas hoy/semana/proxima | KPIs calculan citas hoy, semana, proxima semana, clientes y servicios realizados | Pendiente | Pendiente | Screenshot |
| ST-049 | Dashboard ganancias | Staff con pagos aprobados | Revisar graficos | Pagos asociados a citas del staff | Graficos diarios/semanales/mensuales muestran montos correctos | Pendiente | Pendiente | Screenshot + calculo |
| ST-050 | Dashboard estados | Staff con citas variadas | Revisar panel "Reservas por etapa" | Estados variados | Agrupa confirmadas, pendientes, finalizadas y canceladas | Pendiente | Pendiente | Screenshot |
| ST-051 | Dashboard tolerancia API | Pagos o clientes fallan | Simular error en servicio | API caida | Muestra alerta y mantiene panel usable con datos parciales | Pendiente | Pendiente | Screenshot |
| ST-052 | Agenda staff | Staff con citas | Abrir vista Agenda | Citas hoy/semana/proxima | Muestra tablas correctas y mensajes vacios cuando no hay citas | Pendiente | Pendiente | Screenshot |
| ST-053 | Finalizar cita | Cita `CONFIRMADA` propia | Click Finalizar | `idCita` valido | `PATCH /api/agenda/citas/mis-citas/{id}/finalizar` cambia a finalizada y refresca | Pendiente | Pendiente | Network + DB |
| ST-054 | Finalizar cita | Cita `EN_ATENCION` propia | Click Finalizar | `idCita` valido | Permite finalizar | Pendiente | Pendiente | Network + DB |
| ST-055 | Finalizar cita | Cita `PENDIENTE`, `FINALIZADA` o `CANCELADA` | Revisar accion | Estados no finalizables | Muestra "Sin accion" o no permite finalizar | Pendiente | Pendiente | Screenshot |
| ST-056 | Finalizar cita seguridad | Staff A autenticado | Intentar finalizar cita de Staff B por API | `idCita` de otro staff | Backend rechaza por no pertenecer al staff autenticado | Pendiente | Pendiente | Response |
| ST-057 | Historial staff | Staff con citas | Abrir Historial | Citas pasadas/futuras | Lista fecha, cliente, servicio, profesional, estado y precio | Pendiente | Pendiente | Screenshot |
| ST-058 | Notificaciones staff | Staff con citas nuevas | Abrir campana | Citas recientes | Badge muestra no leidas; popover lista hasta 5 recientes | Pendiente | Pendiente | Screenshot |
| ST-059 | Notificaciones staff | Popover abierto | Cerrar y reabrir | localStorage activo | Citas quedan marcadas como vistas para ese staff | Pendiente | Pendiente | DevTools |
| ST-060 | Notificaciones staff | Popover abierto | Click "Revisar agenda" | Citas recientes | Cierra popover y navega a vista Agenda | Pendiente | Pendiente | Screenshot |
| ST-061 | Perfil propio staff | Portal staff | Abrir Perfil | Perfil completo | Muestra email, telefono, RUT, nacimiento, experiencia, genero y especialidad | Pendiente | Pendiente | Screenshot |
| ST-062 | Editar perfil propio | Portal staff perfil | Click Editar perfil, cambiar telefono | Datos validos | `PUT /api/perfiles/actualizar` actualiza solo perfil propio | Pendiente | Pendiente | Network + Screenshot |
| ST-063 | Editar perfil propio validacion | Modal editar propio | Ingresar email invalido o experiencia negativa | Datos invalidos | UI bloquea guardado y muestra errores | Pendiente | Pendiente | Screenshot |
| ST-064 | Jornada portal staff | Staff con jornada | Abrir Jornada | Jornada existente | Muestra jornada en modo lectura y no permite editar desde portal | Pendiente | Pendiente | Screenshot |
| ST-065 | Portfolio portal staff bio | Abrir Portfolio | Editar biografia y guardar | Texto nuevo | `PUT /api/perfiles/actualizar` guarda descripcion y refresca preview/publico | Pendiente | Pendiente | Network + Screenshot |
| ST-066 | Portfolio portal staff imagen | Abrir Portfolio | Subir imagen valida | JPG/PNG/WebP | Sube imagen a portfolio propio y aparece en galeria | Pendiente | Pendiente | Network + Screenshot |
| ST-067 | Portfolio portal staff imagen | Abrir Portfolio | Eliminar imagen propia | `idFoto` propio | Elimina imagen y refresca galeria | Pendiente | Pendiente | Network + Screenshot |
| ST-068 | Portfolio seguridad | Staff A autenticado | Intentar borrar/subir portfolio de Staff B por API | `idStaff` ajeno | Backend responde 403 "Solo puedes modificar tu propio portfolio" | Pendiente | Pendiente | Response |
| ST-069 | Vista previa publica | Portfolio staff | Click "Vista previa del perfil" | Staff con servicios y jornada | Modal publico muestra bio, foto/portfolio, horarios y servicios asociados | Pendiente | Pendiente | Screenshot |
| ST-070 | Vista previa servicios | Staff sin servicios asociados | Abrir preview | Sin relaciones catalogo | Preview no rompe y muestra servicios vacios o warning si API falla | Pendiente | Pendiente | Screenshot |
| ST-071 | Publico profesionales | Staff activo con foto/bio/portfolio | Entrar a `/profesionales` | Staff publico | Profesional aparece con datos actualizados visibles para clientes | Pendiente | Pendiente | Screenshot |
| ST-072 | Reserva cliente | Staff con jornada y servicio asignado | Flujo reservar por servicio | Cliente autenticado | Staff aparece como opcion del servicio y disponibilidad respeta jornada | Pendiente | Pendiente | Screenshot + Network |
| ST-073 | Reserva cliente | Staff sin relacion servicio | Flujo reservar servicio | Servicio no asignado al staff | Staff no aparece o backend no valida relacion servicio-staff | Pendiente | Pendiente | Network |
| ST-074 | Seguridad API admin | Token staff/cliente | Llamar `GET /api/admin/staff` | Token no admin | Backend responde 403 | Pendiente | Pendiente | Response |
| ST-075 | Seguridad API admin | Sin token | Llamar `POST /api/admin/crear` | Sin Authorization | Backend responde 401/403 y no crea perfil | Pendiente | Pendiente | Response |

## Pruebas de integracion minima

1. Crear un staff desde `/admin/staff`.
2. Asociar ese staff a un servicio activo desde el modulo de servicios o por `POST /api/servicio-staff`.
3. Configurar jornada activa desde tab Jornada en `/admin/staff`.
4. Subir foto y 2 imagenes de portfolio.
5. Entrar a `/profesionales` y confirmar que el perfil publico refleja los cambios.
6. Entrar como cliente a `/reservar`, elegir el servicio asociado y confirmar que el staff aparece con disponibilidad.
7. Crear una cita para ese staff.
8. Entrar como staff a `/staff`, confirmar notificacion, agenda, dashboard e historial.
9. Finalizar la cita desde el portal staff.
10. Confirmar que dashboard/historial actualizan estado, servicios realizados y clientes atendidos.

## Pruebas de regresion visual y responsive

Ejecutar en escritorio y mobile:

- `/admin/staff`: tabla, filtros, modal detalle, modal crear/editar, tabs Perfil/Jornada/Portfolio, dialogo eliminar.
- `/staff`: sidebar abierto/cerrado, topbar, campana, dashboard, tablas, formulario de perfil, portfolio y preview publico.
- `/profesionales`: tarjeta/perfil publico del staff actualizado.
- Flujo `/reservar`: selector de profesionales con staff asociado.

Validaciones visuales:

- Sin solapamientos de modales, tablas y sidebar.
- Textos largos de nombres, emails y especialidades no rompen layout.
- Estados vacios y errores son visibles.
- Botones deshabilitados se distinguen correctamente.
- Imagenes rotas usan fallback de `SafeImage`.

## Evidencia recomendada

Capturar por cada caso:

- Screenshot o video corto del flujo.
- Network tab con request/response para endpoints criticos.
- Fila de base de datos cuando aplique.
- Logs de microservicio si hay error backend.
- Usuario/rol utilizado.
- Fecha/hora de ejecucion y ambiente.

Consultas SQL utiles:

```sql
SELECT id_persona, id_auth, tipo_perfil, rut, nombre, apellidos,
       email_contacto, telefono, activo, foto_url, created_at, updated_at
FROM personas
WHERE tipo_perfil = 'STAFF'
ORDER BY updated_at DESC
LIMIT 20;
```

```sql
SELECT id_staff, dia_semana, hora_inicio, hora_fin, activo
FROM jornadas_staff
WHERE id_staff = '<UUID_STAFF>'
ORDER BY dia_semana;
```

```sql
SELECT id_cita, id_staff, id_cliente, id_servicio, fecha_hora_inicio,
       fecha_hora_fin, estado_cita, updated_at
FROM citas
WHERE id_staff = '<UUID_STAFF>'
ORDER BY fecha_hora_inicio DESC;
```

## Pruebas automatizadas sugeridas

Frontend:

- React Testing Library + MSW para `StaffFormModal`: validaciones, foto requerida, editar vs crear.
- React Testing Library + MSW para `StaffWorkSchedule`: validacion de horas, guardado y modo `readOnly`.
- React Testing Library + MSW para `StaffPortfolioGallery`: tipo/tamano de archivo, previews, upload y delete.
- Playwright/Cypress para `/admin/staff`: crear, editar, cambiar foto, jornada, portfolio y eliminar.
- Playwright/Cypress para `/staff`: dashboard, agenda, finalizar cita, editar perfil, portfolio y notificaciones.

Backend:

- `AdminController`: 401/403 por rol, crear/editar/eliminar staff, upload/delete foto.
- `PerfilController`: portfolio publico, upload/delete con staff propio/admin, 403 para staff ajeno.
- `JornadaStaffController`: reemplazo de jornadas, validacion de dia/hora, listado por staff.
- `CitaController`: `mis-citas` filtra por staff autenticado y `finalizar` solo permite citas propias.
- `ServicioStaffController`: asignar/desactivar staff a servicio y validar visibilidad en disponibilidad.

## Criterios de salida

La funcionalidad de staff se considera validada cuando:

- Todos los casos criticos de permisos, CRUD staff, jornada, portfolio, portal staff y finalizacion de citas estan aprobados.
- No hay errores bloqueantes en consola ni requests fallidos inesperados.
- El staff creado/actualizado se refleja en admin, portal staff, perfil publico y flujo de reserva.
- Las acciones restringidas por rol responden 401/403 y no modifican datos.
- Las cargas de imagen validan tipo/tamano y no dejan previews o registros inconsistentes tras fallas.
