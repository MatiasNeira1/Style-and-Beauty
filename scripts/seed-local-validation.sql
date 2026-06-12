-- Seed manual para validacion local de auth + agenda.
-- Uso:
--   docker compose exec postgres-master psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /path/en/contenedor/seed-local-validation.sql
-- O desde el host:
--   psql "$DATABASE_URL" -f scripts/seed-local-validation.sql
--
-- Ajusta el id_auth del cliente al Firebase UID real usado para login antes de
-- validar GET /api/perfiles/me y POST /api/agenda/citas con token real.
-- No ejecutar en produccion sin revisar IDs y fechas.

BEGIN;

INSERT INTO especialidades (nombre, descripcion)
VALUES ('Cosmetologia integral QA', 'Seed local para validacion funcional de Style and Beauty')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO personas (
    id_persona,
    id_auth,
    rut,
    nombre,
    apellidos,
    fecha_nacimiento,
    genero,
    telefono,
    email_contacto,
    fecha_registro
)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'firebase-staff-local-validation',
    '11111111-1',
    'Valentina',
    'Estilista QA',
    DATE '1990-01-10',
    'FEMENINO',
    '+56911111111',
    'staff.qa@style-beauty.local',
    now()
)
ON CONFLICT (id_persona) DO UPDATE
SET nombre = EXCLUDED.nombre,
    apellidos = EXCLUDED.apellidos,
    telefono = EXCLUDED.telefono,
    email_contacto = EXCLUDED.email_contacto;

INSERT INTO staff (
    id_staff,
    id_especialidad,
    holgura_cita_minutos,
    foto_url,
    cv_url,
    descripcion_perfil
)
SELECT
    '11111111-1111-1111-1111-111111111111',
    e.id_especialidad,
    30,
    NULL,
    NULL,
    'Profesional seed para validar agenda y disponibilidad local.'
FROM especialidades e
WHERE e.nombre = 'Cosmetologia integral QA'
ON CONFLICT (id_staff) DO UPDATE
SET id_especialidad = EXCLUDED.id_especialidad,
    holgura_cita_minutos = EXCLUDED.holgura_cita_minutos,
    descripcion_perfil = EXCLUDED.descripcion_perfil;

INSERT INTO personas (
    id_persona,
    id_auth,
    rut,
    nombre,
    apellidos,
    fecha_nacimiento,
    genero,
    telefono,
    email_contacto,
    fecha_registro
)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'REEMPLAZAR_CON_FIREBASE_UID_CLIENTE_REAL',
    '22222222-2',
    'Cliente',
    'Firebase QA',
    DATE '1995-05-20',
    'NO_ESPECIFICADO',
    '+56922222222',
    'cliente.qa@style-beauty.local',
    now()
)
ON CONFLICT (id_persona) DO UPDATE
SET id_auth = EXCLUDED.id_auth,
    nombre = EXCLUDED.nombre,
    apellidos = EXCLUDED.apellidos,
    telefono = EXCLUDED.telefono,
    email_contacto = EXCLUDED.email_contacto;

INSERT INTO clientes (id_cliente, puntos_fidelidad)
VALUES ('22222222-2222-2222-2222-222222222222', 0)
ON CONFLICT (id_cliente) DO UPDATE
SET puntos_fidelidad = EXCLUDED.puntos_fidelidad;

INSERT INTO servicio (
    id_servicio,
    nombre,
    descripcion,
    detallerservicio,
    categoria,
    manual_uso_url,
    duracion_minutos,
    holgura_minutos,
    precio_total,
    monto_fianza,
    activo
)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Tratamiento facial QA',
    'Servicio seed para validacion local.',
    'Incluye limpieza, preparacion y cierre. Seed no productivo.',
    'Facial',
    NULL,
    60,
    30,
    45000,
    10000,
    true
)
ON CONFLICT (id_servicio) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    detallerservicio = EXCLUDED.detallerservicio,
    categoria = EXCLUDED.categoria,
    duracion_minutos = EXCLUDED.duracion_minutos,
    holgura_minutos = EXCLUDED.holgura_minutos,
    precio_total = EXCLUDED.precio_total,
    monto_fianza = EXCLUDED.monto_fianza,
    activo = EXCLUDED.activo;

INSERT INTO servicio_staff (id, id_servicio, id_staff, activo, created_at)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    true,
    now()
)
ON CONFLICT (id_servicio, id_staff) DO UPDATE
SET activo = EXCLUDED.activo;

INSERT INTO jornadas_staff (id_jornada, id_staff, dia_semana, hora_inicio, hora_fin, activo, created_at)
VALUES
    ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 1, TIME '09:00', TIME '18:00', true, now()),
    ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 2, TIME '09:00', TIME '18:00', true, now()),
    ('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', 3, TIME '09:00', TIME '18:00', true, now()),
    ('55555555-5555-5555-5555-555555555554', '11111111-1111-1111-1111-111111111111', 4, TIME '09:00', TIME '18:00', true, now()),
    ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 5, TIME '09:00', TIME '18:00', true, now())
ON CONFLICT (id_jornada) DO UPDATE
SET hora_inicio = EXCLUDED.hora_inicio,
    hora_fin = EXCLUDED.hora_fin,
    activo = EXCLUDED.activo;

INSERT INTO bloqueos_agenda (
    id_bloqueo,
    id_staff,
    fecha_hora_inicio,
    fecha_hora_fin,
    motivo,
    tipo_bloqueo,
    creado_por,
    created_at
)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMPTZ '2030-01-07 14:00:00-03',
    TIMESTAMPTZ '2030-01-07 15:00:00-03',
    'Bloqueo QA para validar disponibilidad',
    'STAFF',
    '11111111-1111-1111-1111-111111111111',
    now()
)
ON CONFLICT (id_bloqueo) DO UPDATE
SET fecha_hora_inicio = EXCLUDED.fecha_hora_inicio,
    fecha_hora_fin = EXCLUDED.fecha_hora_fin,
    motivo = EXCLUDED.motivo,
    tipo_bloqueo = EXCLUDED.tipo_bloqueo;

INSERT INTO citas (
    id_cita,
    id_cliente,
    id_staff,
    id_servicio,
    fecha_hora_inicio,
    fecha_hora_fin,
    fecha_hora_fin_atencion,
    duracion_servicio_min,
    holgura_min,
    estado_cita,
    tipo_cita,
    expiracion_reserva,
    id_transaccion_pago,
    google_calendar_event_id,
    observacion_cliente,
    observacion_staff,
    created_at,
    updated_at
)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    TIMESTAMPTZ '2030-01-07 10:00:00-03',
    TIMESTAMPTZ '2030-01-07 11:30:00-03',
    TIMESTAMPTZ '2030-01-07 11:00:00-03',
    60,
    30,
    'CONFIRMADA',
    'NORMAL',
    NULL,
    NULL,
    NULL,
    'Cita seed QA',
    NULL,
    now(),
    now()
)
ON CONFLICT (id_cita) DO UPDATE
SET fecha_hora_inicio = EXCLUDED.fecha_hora_inicio,
    fecha_hora_fin = EXCLUDED.fecha_hora_fin,
    fecha_hora_fin_atencion = EXCLUDED.fecha_hora_fin_atencion,
    estado_cita = EXCLUDED.estado_cita,
    updated_at = now();

COMMIT;
