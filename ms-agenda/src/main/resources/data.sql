INSERT INTO jornadas_staff (
    id_jornada,
    id_staff,
    dia_semana,
    hora_inicio,
    hora_fin,
    activo,
    created_at
)
SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 1, '09:00', '18:00', true, now()
WHERE NOT EXISTS (
    SELECT 1 FROM jornadas_staff
    WHERE id_staff = '11111111-1111-1111-1111-111111111111' AND dia_semana = 1
);

INSERT INTO jornadas_staff (
    id_jornada,
    id_staff,
    dia_semana,
    hora_inicio,
    hora_fin,
    activo,
    created_at
)
SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 2, '09:00', '18:00', true, now()
WHERE NOT EXISTS (
    SELECT 1 FROM jornadas_staff
    WHERE id_staff = '11111111-1111-1111-1111-111111111111' AND dia_semana = 2
);

INSERT INTO jornadas_staff (
    id_jornada,
    id_staff,
    dia_semana,
    hora_inicio,
    hora_fin,
    activo,
    created_at
)
SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 3, '09:00', '18:00', true, now()
WHERE NOT EXISTS (
    SELECT 1 FROM jornadas_staff
    WHERE id_staff = '11111111-1111-1111-1111-111111111111' AND dia_semana = 3
);

INSERT INTO jornadas_staff (
    id_jornada,
    id_staff,
    dia_semana,
    hora_inicio,
    hora_fin,
    activo,
    created_at
)
SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 4, '09:00', '18:00', true, now()
WHERE NOT EXISTS (
    SELECT 1 FROM jornadas_staff
    WHERE id_staff = '11111111-1111-1111-1111-111111111111' AND dia_semana = 4
);

INSERT INTO jornadas_staff (
    id_jornada,
    id_staff,
    dia_semana,
    hora_inicio,
    hora_fin,
    activo,
    created_at
)
SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 5, '09:00', '18:00', true, now()
WHERE NOT EXISTS (
    SELECT 1 FROM jornadas_staff
    WHERE id_staff = '11111111-1111-1111-1111-111111111111' AND dia_semana = 5
);
