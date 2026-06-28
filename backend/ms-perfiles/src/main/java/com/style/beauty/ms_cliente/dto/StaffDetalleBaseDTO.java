package com.style.beauty.ms_cliente.dto;

import java.time.LocalDate;
import java.util.UUID;

public record StaffDetalleBaseDTO(
        UUID idStaff,
        String idAuth,
        String rut,
        String nombre,
        String apellidos,
        LocalDate fechaNacimiento,
        String genero,
        String telefono,
        String emailContacto,
        Long idEspecialidad,
        String especialidad,
        String fotoUrl,
        String cvUrl,
        String descripcionPerfil,
        Integer experienciaAnios,
        Boolean activo
) {
}
