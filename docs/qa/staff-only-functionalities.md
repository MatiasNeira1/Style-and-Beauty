# Funcionalidades testeables: portal staff

## Alcance

Este archivo lista solo funcionalidades testeables para usuarios con rol `STAFF` dentro del portal `/staff`.

No incluye:

- Panel admin `/admin/staff`.
- Creacion, edicion o eliminacion de staff por administrador.
- Flujo de reserva como cliente.
- Pruebas de pagos completas.
- Solicitud de vacaciones, porque actualmente es una vista "Proximamente".

## Funcionalidades que puedes testear

| ID | Funcionalidad | Que probar | Resultado esperado |
|---|---|---|---|
| SF-001 | Acceso al portal staff | Iniciar sesion con usuario `STAFF` y entrar a `/staff` | Carga el portal Staff Center |
| SF-002 | Bloqueo sin perfil asociado | Entrar con usuario staff que no tenga perfil en perfiles | Muestra mensaje "Perfil no encontrado" |
| SF-003 | Cierre de sesion | Presionar "Cerrar sesion" desde sidebar o topbar | La sesion se cierra y la ruta queda protegida |
| SF-004 | Navegacion del menu | Cambiar entre Dashboard, Agenda, Historial, Perfil, Jornada y Portfolio | La vista cambia correctamente |
| SF-005 | Query param de vista | Entrar directo a `/staff?view=agenda`, `/staff?view=history`, `/staff?view=profile`, etc. | Abre la vista solicitada |
| SF-006 | Vista invalida por URL | Entrar a `/staff?view=valor-invalido` | Vuelve al Dashboard |
| SF-007 | Sidebar | Ocultar y mostrar el menu lateral | El layout se adapta sin romperse |
| SF-008 | Topbar | Revisar fecha, titulo Panel Staff, botones de asistente, notificaciones y logout | Todos los controles se muestran correctamente |
| SF-009 | Asistente virtual | Presionar boton "Asistente" | Abre el chatbot si existe el boton global `.chatbot-toggle` |
| SF-010 | Dashboard KPIs | Revisar tarjetas de metricas | Muestra citas de hoy, semana, proxima semana, clientes atendidos y servicios realizados |
| SF-011 | Dashboard sin citas | Usar staff sin citas asignadas | KPIs en cero y estados vacios sin errores |
| SF-012 | Dashboard con citas | Usar staff con citas en distintos dias | Las metricas se calculan segun fechas reales |
| SF-013 | Dashboard clientes atendidos | Staff con citas finalizadas en el mes | Cuenta clientes unicos atendidos |
| SF-014 | Dashboard servicios realizados | Staff con citas finalizadas | Cuenta servicios/citas finalizadas del mes |
| SF-015 | Dashboard estados | Staff con citas pendientes, confirmadas, finalizadas y canceladas | Panel agrupa reservas por etapa |
| SF-016 | Ganancias diarias | Staff con pagos aprobados asociados a sus citas | Grafico diario muestra montos correctos |
| SF-017 | Ganancias semanales | Staff con pagos aprobados en distintas semanas | Grafico semanal muestra comparativo correcto |
| SF-018 | Ganancias mensuales | Staff con pagos aprobados en distintos meses | Grafico mensual muestra comparativo correcto |
| SF-019 | Error de agenda en dashboard | Simular fallo de citas | Muestra alerta y mantiene panel usable |
| SF-020 | Error de catalogo en dashboard | Simular fallo de servicios | Muestra alerta y usa identificadores cuando aplique |
| SF-021 | Error de pagos en dashboard | Simular fallo de pagos | Muestra alerta y deja ganancias en cero |
| SF-022 | Error de clientes en dashboard | Simular fallo de clientes | Muestra alerta y usa id/nombres disponibles |
| SF-023 | Vista Agenda | Abrir menu Agenda | Muestra tablas de citas de hoy, semana y proxima semana |
| SF-024 | Agenda de hoy | Staff con citas hoy | Tabla "Citas para hoy" lista fecha, cliente, servicio, profesional, estado y precio |
| SF-025 | Agenda semana actual | Staff con citas dentro de lunes a domingo actual | Tabla semanal lista solo esas citas |
| SF-026 | Agenda proxima semana | Staff con citas la semana siguiente | Tabla proxima semana lista solo esas citas |
| SF-027 | Agenda vacia | Staff sin citas en el periodo | Muestra mensaje de tabla vacia |
| SF-028 | Finalizar cita confirmada | Presionar "Finalizar" en cita `CONFIRMADA` | La cita cambia a finalizada y se refresca la agenda |
| SF-029 | Finalizar cita en atencion | Presionar "Finalizar" en cita `EN_ATENCION` | La cita cambia a finalizada |
| SF-030 | Cita no finalizable | Revisar cita `PENDIENTE`, `FINALIZADA` o `CANCELADA` | No permite finalizar y muestra "Sin accion" |
| SF-031 | Error al finalizar cita | Simular error del backend al finalizar | Muestra alerta de error |
| SF-032 | Historial | Abrir menu Historial | Lista servicios y citas asignadas al staff |
| SF-033 | Orden del historial | Staff con varias citas | Las citas se ordenan por fecha descendente o segun comportamiento esperado |
| SF-034 | Datos del historial | Revisar una fila | Muestra fecha, cliente, servicio, profesional, estado y precio |
| SF-035 | Historial vacio | Staff sin citas | Muestra mensaje "Aun no hay servicios asociados a tu agenda" |
| SF-036 | Perfil propio | Abrir menu Perfil | Muestra datos del profesional autenticado |
| SF-037 | Datos personales | Revisar perfil | Muestra email, telefono, RUT, nacimiento, experiencia y genero |
| SF-038 | Especialidad | Revisar encabezado de perfil | Muestra especialidad o "Sin especialidad" |
| SF-039 | Editar perfil propio | Presionar "Editar perfil" | Abre modal de edicion |
| SF-040 | Guardar perfil valido | Cambiar telefono, genero, experiencia u otro dato permitido | Guarda con `PUT /api/perfiles/actualizar` |
| SF-041 | Validacion RUT | Ingresar RUT vacio o invalido | Muestra error y no guarda |
| SF-042 | Validacion nombre | Dejar nombre vacio | Muestra error y no guarda |
| SF-043 | Validacion email | Ingresar email invalido | Muestra error y no guarda |
| SF-044 | Validacion telefono | Ingresar telefono con formato invalido | Muestra error y no guarda |
| SF-045 | Validacion fecha nacimiento | Ingresar fecha con formato invalido si aplica | Muestra error y no guarda |
| SF-046 | Validacion especialidad | Dejar especialidad vacia | Muestra error y no guarda |
| SF-047 | Validacion experiencia | Ingresar experiencia negativa | Muestra error y no guarda |
| SF-048 | Cancelar edicion perfil | Modificar datos y cancelar | No persiste cambios |
| SF-049 | Error al guardar perfil | Simular error de API | Muestra mensaje de error en modal |
| SF-050 | Accesos rapidos perfil | Presionar Biografia, Jornada Laboral o Portfolio | Navega a la seccion correspondiente |
| SF-051 | Satisfaccion referencial | Abrir/cerrar comentarios | Muestra u oculta panel de comentarios |
| SF-052 | Jornada propia | Abrir menu Jornada | Muestra jornada laboral fija del staff |
| SF-053 | Jornada modo lectura | Intentar editar horarios desde portal staff | No permite editar porque la vista es read-only |
| SF-054 | Dias activos | Staff con jornadas activas | Muestra hora inicio, hora fin y estado Activo |
| SF-055 | Dias inactivos | Staff con jornadas inactivas | Muestra "-" y estado Inactivo |
| SF-056 | Jornada sin datos | Staff sin jornada configurada | Muestra jornada default o estado consistente sin romper pantalla |
| SF-057 | Portfolio | Abrir menu Portfolio | Muestra editor de biografia, zona de carga y galeria |
| SF-058 | Biografia profesional | Editar texto de biografia | Campo permite escribir y modificar contenido |
| SF-059 | Guardar biografia | Presionar "Guardar biografia" | Guarda con `PUT /api/perfiles/actualizar` |
| SF-060 | Error guardar biografia | Simular error de API | Muestra alerta de error |
| SF-061 | Subir imagen portfolio JPG | Seleccionar JPG menor a 5 MB | Sube y aparece en galeria |
| SF-062 | Subir imagen portfolio PNG | Seleccionar PNG menor a 5 MB | Sube y aparece en galeria |
| SF-063 | Subir imagen portfolio WebP | Seleccionar WebP menor a 5 MB | Sube y aparece en galeria |
| SF-064 | Subir multiples imagenes | Seleccionar varias imagenes validas | Sube cada imagen y muestra previews temporales |
| SF-065 | Drag and drop portfolio | Arrastrar imagen valida a la zona de carga | Sube correctamente |
| SF-066 | Tipo de archivo invalido | Subir PDF, TXT u otro tipo | Muestra error "Solo se permiten imagenes JPG, PNG o WEBP" |
| SF-067 | Imagen mayor a 5 MB | Subir archivo grande | Muestra error de tamano maximo |
| SF-068 | Error al subir imagen | Simular error de API | Muestra alerta y no deja preview permanente incorrecto |
| SF-069 | Eliminar imagen portfolio | Presionar eliminar en imagen existente | Elimina imagen y refresca galeria |
| SF-070 | Error al eliminar imagen | Simular error de API | Muestra alerta |
| SF-071 | Portfolio vacio | Staff sin imagenes | Muestra estado vacio "Aun no hay fotos en tu portfolio" |
| SF-072 | Preview publico | Presionar "Vista previa del perfil" | Abre modal con perfil publico del staff |
| SF-073 | Preview con datos actualizados | Cambiar bio o portfolio y abrir preview | Refleja cambios guardados |
| SF-074 | Preview con servicios asociados | Staff tiene servicios asociados | Muestra servicios en perfil publico |
| SF-075 | Preview sin servicios asociados | Staff sin servicios asociados | No rompe la vista y muestra estado consistente |
| SF-076 | Error servicios asociados | Simular fallo al consultar servicios | Muestra warning "Servicios asociados no disponibles temporalmente" |
| SF-077 | Notificaciones badge | Staff con citas nuevas | Campana muestra contador |
| SF-078 | Notificaciones popover | Abrir campana | Lista citas recientes con cliente, servicio y fecha |
| SF-079 | Notificaciones maximas | Staff con mas de 5 citas recientes | Popover muestra solo las 5 mas recientes |
| SF-080 | Marcar notificaciones vistas | Abrir popover | Guarda ids vistos en localStorage |
| SF-081 | Persistencia de notificaciones | Recargar despues de abrir popover | No vuelve a contar citas ya vistas |
| SF-082 | Notificaciones vacias | Staff sin citas | Muestra "Aun no hay citas asignadas" |
| SF-083 | Ir a agenda desde notificaciones | Click "Revisar agenda" | Cierra popover y navega a Agenda |
| SF-084 | Actualizacion automatica citas | Esperar intervalo de refresco | Reconsulta citas aproximadamente cada 15 segundos |
| SF-085 | Formato fechas | Revisar fechas en dashboard, agenda, historial y notificaciones | Usa formato `es-CL` legible |
| SF-086 | Responsive desktop | Revisar `/staff` en ancho desktop | Layout sin solapamientos |
| SF-087 | Responsive mobile | Revisar `/staff` en mobile | Menu, tablas y cards son usables |
| SF-088 | Textos largos | Staff con nombre/email/especialidad largos | No rompe layout ni corta informacion critica |
| SF-089 | Imagen rota | Foto o portfolio con URL invalida | `SafeImage` usa fallback sin romper la pantalla |
| SF-090 | Estado de carga perfil | Cargar portal con red lenta | Muestra loader mientras carga perfil |
| SF-091 | Error carga perfil | Fallo en `GET /api/perfiles/me` | Muestra alerta o estado de error controlado |
| SF-092 | Staff local dev mock | En localhost sin perfil real, si aplica | Usa mock local definido para desarrollo |
| SF-093 | Seguridad portfolio propio | Intentar modificar portfolio de otro staff por API | Backend debe responder 403 |
| SF-094 | Seguridad finalizar cita propia | Intentar finalizar cita de otro staff por API | Backend debe rechazar |
| SF-095 | Seguridad datos propios | Editar perfil desde portal staff | Solo modifica el perfil del usuario autenticado |

## APIs que se validan desde staff

| Funcionalidad | API |
|---|---|
| Cargar perfil propio | `GET /api/perfiles/me` |
| Actualizar perfil propio | `PUT /api/perfiles/actualizar` |
| Cargar especialidades | `GET /api/perfiles/especialidades` |
| Cargar citas propias | `GET /api/agenda/citas/mis-citas` |
| Finalizar cita propia | `PATCH /api/agenda/citas/mis-citas/{id}/finalizar` |
| Cargar clientes para enriquecer historial | `GET /api/perfiles/clientes` |
| Cargar servicios para enriquecer historial | `GET /api/servicio` |
| Cargar pagos para graficos | Endpoint usado por `paymentService.listTransactions` |
| Cargar jornada propia | `GET /api/agenda/jornadas/staff/{idStaff}` |
| Cargar portfolio | `GET /api/perfiles/staff/{idStaff}/portfolio` |
| Subir imagen portfolio | `POST /api/perfiles/staff/{idStaff}/portfolio` |
| Eliminar imagen portfolio | `DELETE /api/perfiles/staff/{idStaff}/portfolio/{idFoto}` |
| Preview publico del staff | `GET /api/perfiles/staff/{idStaff}` |
| Servicios asociados al staff | `GET /api/servicio/{idServicio}/staff` |

## Funcionalidades no testeables desde rol staff

- Crear nuevo profesional.
- Editar otro profesional.
- Eliminar profesional.
- Cambiar foto principal desde panel admin.
- Activar/desactivar staff.
- Modificar jornada desde portal staff, porque esta vista esta en modo lectura.
- Asociar staff a servicios.
- Administrar pagos, clientes, inventario o servicios.
- Crear reservas como cliente.
- Solicitar vacaciones, porque la pantalla aun esta marcada como proximamente.
