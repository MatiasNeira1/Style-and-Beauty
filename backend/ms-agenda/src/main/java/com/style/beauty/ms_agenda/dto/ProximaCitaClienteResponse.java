package com.style.beauty.ms_agenda.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProximaCitaClienteResponse(
        UUID idCita,
        UUID idServicio,
        String servicioNombre,
        UUID idStaff,
        String profesionalNombre,
        OffsetDateTime fechaHoraInicio,
        OffsetDateTime fechaHoraFin,
        OffsetDateTime fechaHoraFinAtencion,
        Integer duracionServicioMin,
        Integer holguraMin,
        String estadoCita,
        BigDecimal valorServicio,
        BigDecimal abonoReserva
) {
}
