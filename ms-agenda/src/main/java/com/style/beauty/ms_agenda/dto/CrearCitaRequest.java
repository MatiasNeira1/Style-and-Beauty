package com.style.beauty.ms_agenda.dto;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CrearCitaRequest(
        @NotNull UUID idCliente,
        @NotNull UUID idStaff,
        @NotNull UUID idServicio,
        @NotNull OffsetDateTime fechaHoraInicio,
        @NotNull Integer duracionServicioMin,
        Integer holguraMin,
        String observacionCliente) {
}