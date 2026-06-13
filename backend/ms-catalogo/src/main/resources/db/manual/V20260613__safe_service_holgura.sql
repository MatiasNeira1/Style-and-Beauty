UPDATE servicio
SET holgura_minutos = GREATEST(0, duracion_minutos - 5)
WHERE duracion_minutos IS NOT NULL
  AND duracion_minutos > 0
  AND holgura_minutos IS NOT NULL
  AND holgura_minutos >= duracion_minutos;

UPDATE servicio
SET holgura_minutos = CASE
    WHEN lower(categoria) LIKE '%cabello%' OR lower(categoria) LIKE '%peluqueria%' THEN LEAST(30, GREATEST(0, duracion_minutos - 5))
    WHEN lower(categoria) LIKE '%maquillaje%' THEN LEAST(15, GREATEST(0, duracion_minutos - 5))
    WHEN lower(categoria) LIKE '%nails%' OR lower(categoria) LIKE '%manicure%' THEN LEAST(15, GREATEST(0, duracion_minutos - 5))
    WHEN lower(categoria) LIKE '%piel%' OR lower(categoria) LIKE '%facial%' THEN LEAST(20, GREATEST(0, duracion_minutos - 5))
    WHEN lower(categoria) LIKE '%spa%' THEN LEAST(30, GREATEST(0, duracion_minutos - 5))
    ELSE holgura_minutos
END
WHERE duracion_minutos IS NOT NULL
  AND duracion_minutos > 0
  AND holgura_minutos IS NULL;
