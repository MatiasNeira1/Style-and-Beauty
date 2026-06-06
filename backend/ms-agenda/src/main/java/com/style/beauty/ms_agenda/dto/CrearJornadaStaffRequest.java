package com.style.beauty.ms_agenda.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;
import java.util.UUID;

public record CrearJornadaStaffRequest(
        @NotNull UUID idStaff,

        @NotNull
        @Min(1)
        @Max(7)
        Integer diaSemana,

        @NotNull LocalTime horaInicio,

        @NotNull LocalTime horaFin,

        Boolean activo
) {
}