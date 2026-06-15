CREATE EXTENSION IF NOT EXISTS btree_gist;;

DO $$
BEGIN
    IF to_regclass('public.citas') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'citas'
             AND column_name = 'google_calendar_event_id'
       ) THEN
        ALTER TABLE citas
            ADD COLUMN google_calendar_event_id varchar(255);
    END IF;
END $$;;

DO $$
BEGIN
    IF to_regclass('public.citas') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'citas_staff_inicio_unico'
       ) THEN
        ALTER TABLE citas
            ADD CONSTRAINT citas_staff_inicio_unico
            UNIQUE (id_staff, fecha_hora_inicio);
    END IF;
END $$;;

DO $$
BEGIN
    IF to_regclass('public.citas') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'citas_staff_sin_solapamientos'
       ) THEN
        ALTER TABLE citas
            ADD CONSTRAINT citas_staff_sin_solapamientos
            EXCLUDE USING gist (
                id_staff WITH =,
                tstzrange(fecha_hora_inicio, fecha_hora_fin, '[)') WITH &&
            )
            WHERE (estado_cita NOT IN ('CANCELADA', 'EXPIRADA', 'RECHAZADA'));
    END IF;
END $$;;
