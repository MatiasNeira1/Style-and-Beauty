package com.style.beauty.ms_cliente.strategy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;
import com.style.beauty.ms_cliente.repository.StaffRepository;
import com.style.beauty.ms_cliente.model.StaffModel;
import com.style.beauty.ms_cliente.model.EspecialidadModel;
@Component
public class StaffStrategy implements PerfilStrategy{

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

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
        staff.setFotoUrl(dto.getFotoUrl());
        staff.setCvUrl(dto.getCvUrl());
        staff.setDescripcionPerfil(dto.getDescripcionPerfil());
        
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

}
