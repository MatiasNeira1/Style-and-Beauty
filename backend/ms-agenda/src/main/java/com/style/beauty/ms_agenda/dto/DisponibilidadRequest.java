package com.style.beauty.ms_agenda.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record DisponibilidadRequest(
        @NotNull UUID idStaff,
        @NotNull UUID idServicio,
        @NotNull LocalDate fecha,
        Integer duracionServicioMin,
        Integer holguraMin) {
}
