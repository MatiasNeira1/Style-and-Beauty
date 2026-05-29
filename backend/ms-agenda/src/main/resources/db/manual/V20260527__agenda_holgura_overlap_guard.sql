-- Ejecutar en PostgreSQL productivo para reforzar la validacion de agenda a nivel BD.
-- Evita carreras simultaneas donde dos requests pasan la validacion de aplicacion al mismo tiempo.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE citas
    ADD COLUMN IF NOT EXISTS fecha_hora_fin_holgura timestamptz,
    ADD COLUMN IF NOT EXISTS duracion_servicio_min integer,
    ADD COLUMN IF NOT EXISTS holgura_min integer;

UPDATE citas
SET fecha_hora_fin_holgura = COALESCE(fecha_hora_fin_holgura, fecha_hora_fin),
    duracion_servicio_min = COALESCE(
        duracion_servicio_min,
        GREATEST(1, CEIL(EXTRACT(EPOCH FROM (fecha_hora_fin - fecha_hora_inicio)) / 60.0)::integer)
    ),
    holgura_min = COALESCE(holgura_min, 20)
WHERE fecha_hora_fin_holgura IS NULL
   OR duracion_servicio_min IS NULL
   OR holgura_min IS NULL;

ALTER TABLE citas
    ALTER COLUMN fecha_hora_fin_holgura SET NOT NULL,
    ALTER COLUMN duracion_servicio_min SET NOT NULL,
    ALTER COLUMN holgura_min SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_citas_staff_inicio_fin_holgura
    ON citas (id_staff, fecha_hora_inicio, fecha_hora_fin_holgura);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'citas_no_overlap_staff_active'
    ) THEN
        ALTER TABLE citas
            ADD CONSTRAINT citas_no_overlap_staff_active
            EXCLUDE USING gist (
                id_staff WITH =,
                tstzrange(fecha_hora_inicio, fecha_hora_fin_holgura, '[)') WITH &&
            )
            WHERE (estado_cita NOT IN ('CANCELADA', 'EXPIRADA', 'RECHAZADA'));
    END IF;
END $$;
