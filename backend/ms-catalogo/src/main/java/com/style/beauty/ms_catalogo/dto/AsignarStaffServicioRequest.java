package com.style.beauty.ms_catalogo.dto;

import java.util.UUID;

public record AsignarStaffServicioRequest(
        UUID idServicio,
        UUID idStaff
) {
}
