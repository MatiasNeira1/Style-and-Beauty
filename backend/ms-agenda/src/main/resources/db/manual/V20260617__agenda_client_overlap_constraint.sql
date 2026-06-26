CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
    IF to_regclass('public.citas') IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'citas_cliente_sin_solapamientos'
             AND pg_get_constraintdef(oid) NOT ILIKE '%COALESCE%'
       ) THEN
        ALTER TABLE citas DROP CONSTRAINT citas_cliente_sin_solapamientos;
    END IF;

    IF to_regclass('public.citas') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'citas_cliente_sin_solapamientos'
       ) THEN
        ALTER TABLE citas
            ADD CONSTRAINT citas_cliente_sin_solapamientos
            EXCLUDE USING gist (
                id_cliente WITH =,
                tstzrange(fecha_hora_inicio, COALESCE(fecha_hora_fin_atencion, fecha_hora_fin), '[)') WITH &&
            )
            WHERE (estado_cita NOT IN ('CANCELADA', 'EXPIRADA', 'RECHAZADA'));
    END IF;
END $$;
