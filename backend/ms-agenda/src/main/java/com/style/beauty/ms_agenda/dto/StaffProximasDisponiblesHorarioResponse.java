package com.style.beauty.ms_agenda.dto;

import java.time.OffsetDateTime;

public record StaffProximasDisponiblesHorarioResponse(
        OffsetDateTime inicio,
        String horaInicio
) {
}
