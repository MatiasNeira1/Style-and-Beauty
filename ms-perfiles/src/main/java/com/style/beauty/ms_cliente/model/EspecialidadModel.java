package com.style.beauty.ms_cliente.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "especialidades")
public class EspecialidadModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEspecialidad;

    @Column(nullable = false, unique = true)
    private String nombre; // "Peluquería", "Manicura", "Masoterapia", etc

    private String descripcion;
}
