package com.style.beauty.ms_agenda.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CrearCitaRequest(
        UUID idCliente,
        @NotNull UUID idStaff,
        @NotNull UUID idServicio,
        @NotNull OffsetDateTime fechaHoraInicio,
        Integer duracionServicioMin,
        Integer holguraMin,
        String observacionCliente,
        BigDecimal abono) {

    public CrearCitaRequest(
            UUID idCliente,
            UUID idStaff,
            UUID idServicio,
            OffsetDateTime fechaHoraInicio,
            Integer duracionServicioMin,
            Integer holguraMin,
            String observacionCliente
    ) {
        this(idCliente, idStaff, idServicio, fechaHoraInicio, duracionServicioMin, holguraMin, observacionCliente, null);
    }

    public CrearCitaRequest withCliente(UUID idCliente) {
        return new CrearCitaRequest(
                idCliente,
                idStaff,
                idServicio,
                fechaHoraInicio,
                duracionServicioMin,
                holguraMin,
                observacionCliente,
                abono);
    }
}
