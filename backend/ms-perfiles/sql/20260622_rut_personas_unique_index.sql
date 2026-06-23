-- Preflight obligatorio antes de aplicar el indice.
-- Si alguna consulta devuelve filas, corregir datos antes de crear el indice.

SELECT id_persona, rut
FROM public.personas
WHERE rut IS NULL OR btrim(rut) = '';

SELECT regexp_replace(upper(rut), '[.\-]', '', 'g') AS rut_compacto, count(*) AS total
FROM public.personas
WHERE rut IS NOT NULL AND btrim(rut) <> ''
GROUP BY regexp_replace(upper(rut), '[.\-]', '', 'g')
HAVING count(*) > 1;

SELECT id_persona, rut
FROM public.personas
WHERE rut IS NOT NULL
  AND btrim(rut) <> ''
  AND regexp_replace(upper(rut), '[.\-]', '', 'g') !~ '^[0-9]{7,8}[0-9K]$';

CREATE UNIQUE INDEX IF NOT EXISTS ux_personas_rut_normalizado
ON public.personas ((regexp_replace(upper(rut), '[.\-]', '', 'g')))
WHERE rut IS NOT NULL AND btrim(rut) <> '';
