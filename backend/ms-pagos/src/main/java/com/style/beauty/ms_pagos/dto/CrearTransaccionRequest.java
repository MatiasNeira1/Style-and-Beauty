package com.style.beauty.ms_pagos.dto;

import com.style.beauty.ms_pagos.enums.TipoPago;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CrearTransaccionRequest(
        UUID idCita,
        UUID idCitaExtraordinaria,

        @NotNull Integer montoTotal,

        Integer montoAbono,
        Integer montoRecargo,

        @NotNull TipoPago tipoPago) {
}