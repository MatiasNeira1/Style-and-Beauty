CREATE TABLE IF NOT EXISTS categoria_portada (
    id UUID PRIMARY KEY,
    categoria VARCHAR(255) NOT NULL UNIQUE,
    imagen_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
