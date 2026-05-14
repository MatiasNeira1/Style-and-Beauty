package com.style.beauty.ms_extra.dto;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CrearCitaExtraordinariaRequest(
        @NotNull UUID idCliente,
        @NotNull UUID idStaff,
        @NotNull UUID idServicio,
        @NotNull OffsetDateTime fechaHoraSolicitada,
        String motivoCliente,
        @NotNull Integer precioBase) {
}