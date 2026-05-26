package com.style.beauty.ms_cliente.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PerfilRequestDTO {
    private String idAuth;    
    private String tipoPerfil; 

    //Los que envia el Frontend en el JSON
    private String rut;
    private String nombre;
    private String apellidos;
    private LocalDate fechaNacimiento;
    private String genero;
    private String telefono;
    private String emailContacto;

    // Solo obligatorio si el tipoPerfil es "STAFF"
    private Long idEspecialidad;
    private String fotoUrl;
    private String cvUrl;
    private String descripcionPerfil;
    private Integer experienciaAnios;
}
