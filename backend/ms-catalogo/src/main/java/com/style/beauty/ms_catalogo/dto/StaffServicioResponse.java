package com.style.beauty.ms_catalogo.dto;

import java.util.UUID;

public record StaffServicioResponse(
        UUID id,
        UUID idServicio,
        UUID idStaff,
        Boolean activo
) {
}
