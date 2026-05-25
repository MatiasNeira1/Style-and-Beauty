package com.style.beauty.ms_agenda.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record DisponibilidadRequest(
        @NotNull UUID idStaff,
        @NotNull LocalDate fecha,
        @NotNull Integer duracionServicioMin,
        Integer holguraMin) {
}
