-- Campos de abono para reservas creadas desde panel administrativo.
-- Manual porque ms-agenda usa spring.jpa.hibernate.ddl-auto por configuración.
ALTER TABLE citas
    ADD COLUMN IF NOT EXISTS monto_abonado NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS total_estimado NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS saldo_pendiente NUMERIC(12, 2);
