package com.style.beauty.ms_agenda.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record DisponibilidadSemanalRequest(
        @NotNull UUID idStaff,
        @NotNull UUID idServicio,
        @JsonAlias("fechaInicioSemana") @NotNull LocalDate fecha
) {
    public LocalDate fechaInicioSemana() {
        return fecha;
    }
}
