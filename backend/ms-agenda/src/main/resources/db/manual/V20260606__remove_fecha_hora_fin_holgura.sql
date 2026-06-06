CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE citas
    DROP CONSTRAINT IF EXISTS citas_staff_sin_solapamientos,
    DROP CONSTRAINT IF EXISTS citas_no_overlap_staff_active;

DROP INDEX IF EXISTS idx_citas_staff_inicio_fin_holgura;

ALTER TABLE citas
    DROP COLUMN IF EXISTS fecha_hora_fin_holgura;

CREATE INDEX IF NOT EXISTS idx_citas_staff_inicio_fin
    ON citas (id_staff, fecha_hora_inicio, fecha_hora_fin);

ALTER TABLE citas
    ADD CONSTRAINT citas_staff_sin_solapamientos
    EXCLUDE USING gist (
        id_staff WITH =,
        tstzrange(fecha_hora_inicio, fecha_hora_fin, '[)') WITH &&
    )
    WHERE (estado_cita NOT IN ('CANCELADA', 'EXPIRADA', 'RECHAZADA'));
