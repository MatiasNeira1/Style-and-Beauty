package com.style.beauty.ms_catalogo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "servicio")
@Data
public class Servicio {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id_servicio;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @Column(nullable = false)
    private Integer duracion_minutos;

    @Column(nullable = false)
    private Integer precio_total;

    @Column(nullable = false)
    private Integer monto_fianza;

    @Column(nullable = false)
    private Boolean activo = true;
}