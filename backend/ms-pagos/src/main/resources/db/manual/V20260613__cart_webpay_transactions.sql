ALTER TABLE transacciones_pago
    ALTER COLUMN id_cita DROP NOT NULL;

ALTER TABLE transacciones_pago
    ADD COLUMN IF NOT EXISTS id_citas TEXT,
    ADD COLUMN IF NOT EXISTS url_webpay VARCHAR(512),
    ADD COLUMN IF NOT EXISTS detalle_items_json TEXT;
