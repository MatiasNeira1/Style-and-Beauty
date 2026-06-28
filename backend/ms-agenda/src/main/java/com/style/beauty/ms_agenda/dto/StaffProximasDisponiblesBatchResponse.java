package com.style.beauty.ms_agenda.dto;

import java.util.List;

public record StaffProximasDisponiblesBatchResponse(
        String zonaHoraria,
        List<StaffProximasDisponiblesResponse> resultados
) {
}
