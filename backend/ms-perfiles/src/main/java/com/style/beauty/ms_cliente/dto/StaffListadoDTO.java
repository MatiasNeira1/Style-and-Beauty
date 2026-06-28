package com.style.beauty.ms_cliente.dto;

import java.util.UUID;

public record StaffListadoDTO(
        UUID idStaff,
        UUID idPersona,
        String nombre,
        String apellidos,
        String especialidad,
        String fotoUrl,
        Integer experienciaAnios,
        Boolean activo
) {
}
