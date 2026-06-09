package com.style.beauty.ms_agenda.dto;

import java.time.LocalDate;
import java.util.List;

public record DisponibilidadMensualResponse(
        LocalDate fecha,
        List<DisponibilidadSlot> slots
) {
}
