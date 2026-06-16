package com.style.beauty.ms_catalogo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "servicio", schema = "public")
@Data
public class Servicio {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id_servicio")
    private UUID id_servicio;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "detallerservicio", columnDefinition = "TEXT")
    private String detallerservicio;

    @Column(name = "categoria")
    private String categoria;

    @Column(name = "manual_uso_url", columnDefinition = "TEXT")
    private String manual_uso_url;

    @Transient
    private String imagenUrl;

    @Column(name = "duracion_minutos", nullable = false)
    private Integer duracion_minutos;

    @Column(name = "holgura_minutos")
    private Integer holgura_minutos;

    @Column(name = "precio_total", nullable = false)
    private Double precio_total;

    @Column(name = "monto_fianza", nullable = false)
    private Double monto_fianza;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;
}
