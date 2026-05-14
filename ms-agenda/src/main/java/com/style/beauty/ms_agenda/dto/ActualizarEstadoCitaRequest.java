package com.style.beauty.ms_agenda.dto;

import com.style.beauty.ms_agenda.enums.EstadoCita;
import jakarta.validation.constraints.NotNull;

public record ActualizarEstadoCitaRequest(
        @NotNull EstadoCita estadoCita,
        String observacionStaff) {
}