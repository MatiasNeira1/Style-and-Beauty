package com.style.beauty.ms_agenda.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record DisponibilidadRequest(
        @NotNull UUID idStaff,
        @NotNull UUID idServicio,
        @NotNull LocalDate fecha,
        Integer duracionServicioMin,
        Integer holguraMin,
        @JsonAlias({"idCliente", "clientId"})
        UUID idCliente) {
    public DisponibilidadRequest(
            UUID idStaff,
            UUID idServicio,
            LocalDate fecha,
            Integer duracionServicioMin,
            Integer holguraMin
    ) {
        this(idStaff, idServicio, fecha, duracionServicioMin, holguraMin, null);
    }
}
