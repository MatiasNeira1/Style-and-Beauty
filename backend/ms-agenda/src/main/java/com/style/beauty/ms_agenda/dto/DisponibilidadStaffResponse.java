package com.style.beauty.ms_agenda.dto;

import java.util.List;
import java.util.UUID;

public record DisponibilidadStaffResponse(
        UUID idStaff,
        List<DisponibilidadSlot> slots
) {
}
