package com.style.beauty.ms_agenda.dto;

import com.style.beauty.ms_agenda.enums.EstadoCita;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CitaAgendaResponse(
        UUID idCita,
        UUID idCliente,
        String nombreCliente,
        UUID idStaff,
        UUID idServicio,
        String nombreServicio,
        OffsetDateTime fechaHoraInicio,
        OffsetDateTime fechaHoraFin,
        OffsetDateTime fechaHoraFinAtencion,
        EstadoCita estadoCita,
        String observacionCliente,
        String observacionStaff,
        String googleCalendarEventId
) {
}
