package com.style.beauty.ms_cliente.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record StaffDetalleDTO(
        UUID idStaff,
        UUID idPersona,
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
        Boolean activo,
        List<StaffPortfolioImageDTO> portfolioImages
) {
    public static StaffDetalleDTO from(StaffDetalleBaseDTO base, List<StaffPortfolioImageDTO> portfolioImages) {
        return new StaffDetalleDTO(
                base.idStaff(),
                base.idStaff(),
                base.idAuth(),
                base.rut(),
                base.nombre(),
                base.apellidos(),
                base.fechaNacimiento(),
                base.genero(),
                base.telefono(),
                base.emailContacto(),
                base.idEspecialidad(),
                base.especialidad(),
                base.fotoUrl(),
                base.cvUrl(),
                base.descripcionPerfil(),
                base.experienciaAnios(),
                base.activo(),
                portfolioImages == null ? List.of() : portfolioImages
        );
    }
}
