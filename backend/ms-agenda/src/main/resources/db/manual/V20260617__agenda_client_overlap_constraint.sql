CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
    IF to_regclass('public.citas') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'citas_cliente_sin_solapamientos'
       ) THEN
        ALTER TABLE citas
            ADD CONSTRAINT citas_cliente_sin_solapamientos
            EXCLUDE USING gist (
                id_cliente WITH =,
                tstzrange(fecha_hora_inicio, fecha_hora_fin, '[)') WITH &&
            )
            WHERE (estado_cita NOT IN ('CANCELADA', 'EXPIRADA', 'RECHAZADA'));
    END IF;
END $$;
