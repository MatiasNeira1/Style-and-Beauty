package com.style.beauty.ms_agenda.dto;

import java.util.UUID;

public record StaffServicioDetalleResponse(
        UUID idStaff,
        String nombre,
        String apellidos,
        String emailContacto,
        Boolean activo
) {
}
