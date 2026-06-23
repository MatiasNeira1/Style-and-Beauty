ALTER TABLE public.servicio
    ADD COLUMN IF NOT EXISTS imagen_url TEXT;

ALTER TABLE public.servicio
    ALTER COLUMN monto_fianza SET DEFAULT 15000;

UPDATE public.servicio
SET monto_fianza = 15000
WHERE monto_fianza IS DISTINCT FROM 15000;

CREATE TABLE IF NOT EXISTS public.servicio_categoria_portada (
    id UUID PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL UNIQUE,
    imagen_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
