ALTER TABLE servicio
    ADD COLUMN IF NOT EXISTS duracion_minutos_min integer;

ALTER TABLE servicio
    ADD COLUMN IF NOT EXISTS duracion_minutos_max integer;

UPDATE servicio
SET duracion_minutos_min = COALESCE(duracion_minutos_min, duracion_minutos),
    duracion_minutos_max = COALESCE(duracion_minutos_max, duracion_minutos)
WHERE duracion_minutos IS NOT NULL;

UPDATE servicio
SET holgura_minutos = 15
WHERE activo = true;

UPDATE servicio
SET duracion_minutos = 150,
    duracion_minutos_min = 150,
    duracion_minutos_max = 150
WHERE lower(nombre) LIKE '%uña acrílica%'
   OR lower(nombre) LIKE '%una acrilica%'
   OR lower(nombre) LIKE '%uñas acrílicas%'
   OR lower(nombre) LIKE '%unas acrilicas%';

UPDATE servicio
SET duracion_minutos = 120,
    duracion_minutos_min = 120,
    duracion_minutos_max = 120
WHERE lower(nombre) LIKE '%soft gel%';

UPDATE servicio
SET duracion_minutos = 90,
    duracion_minutos_min = 90,
    duracion_minutos_max = 90
WHERE lower(nombre) LIKE '%uña permanente%'
   OR lower(nombre) LIKE '%una permanente%'
   OR lower(nombre) LIKE '%uñas permanentes%'
   OR lower(nombre) LIKE '%unas permanentes%';

UPDATE servicio
SET duracion_minutos = 60,
    duracion_minutos_min = 60,
    duracion_minutos_max = 60
WHERE lower(nombre) LIKE '%manicure tradicional%';

UPDATE servicio
SET duracion_minutos = 210,
    duracion_minutos_min = 210,
    duracion_minutos_max = 210
WHERE lower(nombre) LIKE '%nail art%';

UPDATE servicio
SET duracion_minutos = 75,
    duracion_minutos_min = 75,
    duracion_minutos_max = 75
WHERE lower(categoria) LIKE '%piel%'
   OR lower(categoria) LIKE '%facial%'
   OR lower(nombre) LIKE '%cicatriz%'
   OR lower(nombre) LIKE '%facial%';

UPDATE servicio
SET duracion_minutos = 90,
    duracion_minutos_min = 90,
    duracion_minutos_max = 90
WHERE lower(nombre) LIKE '%pedicura%';

UPDATE servicio
SET duracion_minutos = 60,
    duracion_minutos_min = 60,
    duracion_minutos_max = 60
WHERE lower(nombre) LIKE '%masaje%'
   OR lower(categoria) LIKE '%masaje%'
   OR lower(categoria) LIKE '%spa%';

UPDATE servicio
SET duracion_minutos = 120,
    duracion_minutos_min = 60,
    duracion_minutos_max = 120
WHERE lower(nombre) LIKE '%peinado%';

UPDATE servicio
SET duracion_minutos = 120,
    duracion_minutos_min = 120,
    duracion_minutos_max = 120
WHERE lower(nombre) LIKE '%alisado%';

UPDATE servicio
SET duracion_minutos = 120,
    duracion_minutos_min = 120,
    duracion_minutos_max = 120
WHERE lower(nombre) LIKE '%tintura%';

UPDATE servicio
SET duracion_minutos = 180,
    duracion_minutos_min = 180,
    duracion_minutos_max = 180
WHERE lower(nombre) LIKE '%mechas%';

UPDATE servicio
SET duracion_minutos = 90,
    duracion_minutos_min = 90,
    duracion_minutos_max = 90
WHERE lower(nombre) LIKE '%corte%pelo%mujer%'
   OR lower(nombre) LIKE '%corte%mujer%';

UPDATE servicio
SET duracion_minutos = 60,
    duracion_minutos_min = 40,
    duracion_minutos_max = 60
WHERE lower(nombre) LIKE '%corte%pelo%hombre%'
   OR lower(nombre) LIKE '%corte%hombre%';

UPDATE servicio
SET duracion_minutos = 120,
    duracion_minutos_min = 120,
    duracion_minutos_max = 120
WHERE lower(nombre) LIKE '%botox capilar%';

UPDATE servicio
SET duracion_minutos = 60,
    duracion_minutos_min = 60,
    duracion_minutos_max = 60
WHERE lower(nombre) LIKE '%maquillaje de día%'
   OR lower(nombre) LIKE '%maquillaje de dia%'
   OR lower(nombre) LIKE '%maquillaje día%'
   OR lower(nombre) LIKE '%maquillaje dia%';

UPDATE servicio
SET duracion_minutos = 60,
    duracion_minutos_min = 60,
    duracion_minutos_max = 60
WHERE lower(nombre) LIKE '%maquillaje de noche%'
   OR lower(nombre) LIKE '%maquillaje noche%';

UPDATE servicio
SET duracion_minutos = 150,
    duracion_minutos_min = 90,
    duracion_minutos_max = 150
WHERE lower(nombre) LIKE '%maquillaje de novia%'
   OR lower(nombre) LIKE '%maquillaje novia%';
