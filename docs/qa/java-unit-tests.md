# Reporte de pruebas unitarias Java

Fecha de ejecucion: 2026-05-29

## Ambiente

- Java: OpenJDK Temurin 21.0.11 LTS
- Version esperada por el proyecto: `.java-version` = `21`
- Maven: Apache Maven 3.9.11
- Sistema: Windows 11

Nota: `mvnw.cmd` no pudo ejecutarse porque busca el comando `powershell`, que no esta disponible en el PATH de esta sesion. Las pruebas se ejecutaron con Maven global mediante `mvn test`.

## Comando

Ejecutar desde cada microservicio:

```powershell
mvn test
```

## Resultado por microservicio

| Microservicio | Resultado | Tests | Observaciones |
|---|---:|---:|---|
| `backend/Api-gateway` | OK | 1 | Context load de Spring Boot correcto. |
| `backend/ms-agenda` | OK | 13 | Se corrigio la regla de solape para bloqueos locales y Google Calendar. |
| `backend/ms-auth` | OK | 1 | Firebase Admin queda omitido en perfil test si no hay credenciales. |
| `backend/ms-catalogo` | OK | 1 | Context load de Spring Boot correcto. |
| `backend/ms-extra` | OK | 1 | Context load de Spring Boot correcto. |
| `backend/ms-inventario` | OK | 1 | Context load de Spring Boot correcto. |
| `backend/ms-notificacion-audit` | OK | 1 | El test pasa aunque MongoDB local rechaza conexion durante el arranque. |
| `backend/ms-pagos` | OK | 1 | Context load de Spring Boot correcto. |
| `backend/ms-perfiles` | OK | 1 | Firebase Admin queda omitido en perfil test si no hay credenciales. |

Total ejecutado: 21 tests, 0 fallos, 0 errores.

## Correccion aplicada

Archivo: `backend/ms-agenda/src/main/java/com/style/beauty/ms_agenda/service/CitaService.java`

La disponibilidad de agenda ahora diferencia dos reglas de borde:

- Citas existentes: se permite iniciar una nueva cita exactamente cuando termina la cita anterior con su holgura.
- Bloqueos locales y bloques ocupados de Google Calendar: se reserva tambien el instante de inicio del bloqueo, por lo que un slot cuya holgura termina exactamente al inicio del bloqueo no queda disponible.

Esta regla mantiene valido el caso de crear una cita a las `10:30` cuando una cita anterior termina su holgura a las `10:30`, y excluye slots que llegan justo al inicio de bloqueos operativos o eventos externos.

## Advertencias no bloqueantes

- Mockito informa que el inline mock maker se auto-adjunta dinamicamente. En futuras versiones del JDK puede requerir configurar Mockito como agente Java.
- Varios context load muestran advertencias de SpringDoc porque `/v3/api-docs` y `/swagger-ui.html` estan habilitados por defecto.
- Algunos tests con H2 muestran advertencias de dialecto explicito. No bloquearon la ejecucion.
- `ms-notificacion-audit` intenta conectar a MongoDB local durante el arranque del contexto; la conexion fue rechazada, pero el test no fallo.
