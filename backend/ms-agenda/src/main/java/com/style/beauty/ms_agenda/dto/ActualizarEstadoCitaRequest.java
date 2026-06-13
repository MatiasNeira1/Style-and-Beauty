package com.style.beauty.ms_agenda.dto;

import com.style.beauty.ms_agenda.enums.EstadoCita;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ActualizarEstadoCitaRequest(
        @NotNull EstadoCita estadoCita,
        UUID idTransaccionPago,
        String observacionStaff) {
}
