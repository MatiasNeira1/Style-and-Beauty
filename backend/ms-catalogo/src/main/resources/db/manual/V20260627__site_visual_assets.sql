CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.site_visual_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_key VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    description TEXT,
    image_url TEXT,
    alt_text VARCHAR,
    section VARCHAR,
    object_position VARCHAR DEFAULT 'center center',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_visual_assets
    ADD COLUMN IF NOT EXISTS object_position VARCHAR DEFAULT 'center center';

ALTER TABLE public.site_visual_assets
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.site_visual_assets
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.site_visual_assets
    ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.site_visual_assets
    ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.site_visual_assets
    ALTER COLUMN is_active SET DEFAULT TRUE;

ALTER TABLE public.site_visual_assets
    ALTER COLUMN object_position SET DEFAULT 'center center';

INSERT INTO public.site_visual_assets (
    asset_key,
    title,
    description,
    alt_text,
    section,
    object_position,
    is_active
) VALUES
    ('home.hero', 'Home / Dashboard publico', 'Imagen principal de la pantalla de inicio.', 'Salon Style and Beauty', 'Home', 'center 28%', TRUE),
    ('services.hero', 'Hero principal de Servicios', 'Cabecera del catalogo publico de servicios.', 'Servicios Style and Beauty', 'Servicios', 'center 42%', TRUE),
    ('services.category.nails', 'Hero de categoria Nails', 'Imagen para la categoria Nails.', 'Servicios de nails', 'Categorias de servicios', 'center center', TRUE),
    ('services.category.cabello', 'Hero de categoria Cabello', 'Imagen para la categoria Cabello.', 'Servicios de cabello', 'Categorias de servicios', 'center 36%', TRUE),
    ('services.category.piel', 'Hero de categoria Cuidados de la piel', 'Imagen para la categoria Cuidados de la piel.', 'Cuidados de la piel', 'Categorias de servicios', 'center center', TRUE),
    ('services.category.spa', 'Hero de categoria Spa', 'Imagen para la categoria Spa.', 'Servicios de spa', 'Categorias de servicios', 'center center', TRUE),
    ('services.category.maquillaje', 'Hero de categoria Maquillaje', 'Imagen para la categoria Maquillaje.', 'Servicios de maquillaje', 'Categorias de servicios', 'center center', TRUE),
    ('professionals.hero', 'Hero de Profesionales', 'Cabecera del directorio publico de profesionales.', 'Equipo profesional Style and Beauty', 'Profesionales', 'center 28%', TRUE),
    ('products.hero', 'Hero de Productos', 'Cabecera de la vitrina publica de productos.', 'Productos profesionales Style and Beauty', 'Productos', 'center 42%', TRUE),
    ('booking.hero', 'Hero de Reservar', 'Cabecera del flujo de reserva publica.', 'Agenda de reservas Style and Beauty', 'Reservar', 'center 42%', TRUE),
    ('contact.hero', 'Hero de Contacto', 'Cabecera de la pagina de contacto.', 'Contacto Style and Beauty', 'Contacto', 'center center', TRUE),
    ('about.hero', 'Hero de Nosotros', 'Cabecera de la pagina institucional.', 'Salon Style and Beauty', 'Nosotros', 'center 42%', TRUE)
ON CONFLICT (asset_key) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    alt_text = EXCLUDED.alt_text,
    section = EXCLUDED.section,
    object_position = COALESCE(public.site_visual_assets.object_position, EXCLUDED.object_position),
    is_active = COALESCE(public.site_visual_assets.is_active, EXCLUDED.is_active),
    updated_at = now();
