package com.style.beauty.ms_agenda.dto;

import java.util.List;
import java.util.UUID;

public record StaffProximasDisponiblesResponse(
        UUID idStaff,
        List<StaffProximasDisponiblesDiaResponse> dias
) {
}
