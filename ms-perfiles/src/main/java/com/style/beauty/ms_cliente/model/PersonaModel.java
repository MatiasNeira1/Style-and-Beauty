package com.style.beauty.ms_cliente.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "personas")
@Inheritance(strategy = InheritanceType.JOINED)

public class PersonaModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_persona")
    private UUID idPersona;

    @Column(name = "id_auth", unique = true, nullable = false)
    private String idAuth; 

    @Column(unique = true, nullable = false, length = 12)
    private String rut; // Agregado el RUT como único

    @Column(nullable = false)
    private String nombre;

    private String apellidos;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento; // Agregada la fecha de nacimiento

    private String genero; // Agregado el género
    
    private String telefono;

    @Column(name = "email_contacto")
    private String emailContacto;

    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();
}
