package com.style.beauty.ms_cliente.strategy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;
import com.style.beauty.ms_cliente.repository.StaffRepository;
import com.style.beauty.ms_cliente.model.StaffModel;
import com.style.beauty.ms_cliente.model.EspecialidadModel;
import com.style.beauty.ms_cliente.util.ProfileImageUrlValidator;
@Component
public class StaffStrategy implements PerfilStrategy{

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Value("${app.company-logo-url:${APP_COMPANY_LOGO_URL:https://stylebeautyimages.blob.core.windows.net/stylebeauty/logo.jpg}}")
    private String companyLogoUrl;

    @Override
    public String getTipoPerfil() {
        return "STAFF";
    }
    @Override
    public PersonaModel crearPerfil(PerfilRequestDTO dto) {
        StaffModel staff = new StaffModel();
        staff.setIdAuth(dto.getIdAuth());
        staff.setRut(dto.getRut());
        staff.setNombre(dto.getNombre());
        staff.setApellidos(dto.getApellidos());
        staff.setFechaNacimiento(dto.getFechaNacimiento());
        staff.setGenero(dto.getGenero());
        staff.setTelefono(dto.getTelefono());
        staff.setEmailContacto(dto.getEmailContacto());
        staff.setFotoUrl(resolverFotoUrl(dto));
        staff.setCvUrl(dto.getCvUrl());
        staff.setDescripcionPerfil(dto.getDescripcionPerfil());
        staff.setExperienciaAnios(dto.getExperienciaAnios());
        
        staff.setHolguraCitaMinutos(20); // Regla de negocio
        
        // Validación de la especialidad
        if (dto.getIdEspecialidad() == null) {
            throw new IllegalArgumentException("El ID de Especialidad es obligatorio para el Staff.");
        }

        EspecialidadModel especialidad = especialidadRepository.findById(dto.getIdEspecialidad())
                .orElseThrow(() -> new IllegalArgumentException("No existe la especialidad con ID: " + dto.getIdEspecialidad()));
        
        staff.setEspecialidad(especialidad);

        return staffRepository.save(staff);
    }

    private String resolverFotoUrl(PerfilRequestDTO dto) {
        if (dto.getFotoUrl() != null && !dto.getFotoUrl().isBlank()) {
            return ProfileImageUrlValidator.validateStoredUrl(dto.getFotoUrl());
        }
        if (Boolean.TRUE.equals(dto.getSinImagenPorAhora())) {
            return companyLogoUrl;
        }
        throw new IllegalArgumentException("La foto del profesional es obligatoria o debes marcar 'Sin imagen por ahora'.");
    }

}
