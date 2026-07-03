package com.style.beauty.ms_agenda.dto;

import java.time.LocalDate;
import java.util.List;

public record StaffProximasDisponiblesDiaResponse(
        LocalDate fecha,
        String label,
        List<StaffProximasDisponiblesHorarioResponse> horarios
) {
}
