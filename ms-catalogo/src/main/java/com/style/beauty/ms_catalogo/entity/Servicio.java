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

    private String categoria;

    private String manual_uso_url;

    @Column(nullable = false)
    private Integer duracion_minutos;

    @Column(nullable = false)
    private Double precio_total;

    @Column(nullable = false)
    private Double monto_fianza;

    @Column(nullable = false)
    private Boolean activo = true;
}