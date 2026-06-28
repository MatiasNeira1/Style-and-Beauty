-- Indices sugeridos para los endpoints livianos de staff.
-- Ejecutar manualmente en produccion luego de revisar EXPLAIN ANALYZE.
-- No corrige datos ni cambia contratos de aplicacion.

CREATE INDEX IF NOT EXISTS ix_staff_id_especialidad
ON public.staff (id_especialidad);

CREATE INDEX IF NOT EXISTS ix_personas_nombre_apellidos
ON public.personas (nombre, apellidos);

CREATE INDEX IF NOT EXISTS ix_staff_portfolio_images_staff_created_at
ON public.staff_portfolio_images (id_staff, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_staff_foto_present
ON public.staff (id_staff)
WHERE foto_url IS NOT NULL AND btrim(foto_url) <> '';

CREATE INDEX IF NOT EXISTS ix_staff_experiencia_present
ON public.staff (id_staff)
WHERE experiencia_anios IS NOT NULL AND experiencia_anios > 0;
