package com.style.beauty.ms_extra.entity;

import com.style.beauty.ms_extra.enums.EstadoNegociacion;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "citas_extraordinarias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CitaExtraordinaria {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idCitaExtraordinaria;

    @Column(nullable = false)
    private UUID idCliente;

    @Column(nullable = false)
    private UUID idStaff;

    @Column(nullable = false)
    private UUID idServicio;

    private UUID idCita;

    @Column(nullable = false)
    private OffsetDateTime fechaHoraSolicitada;

    private OffsetDateTime fechaHoraPropuesta;

    @Column(columnDefinition = "TEXT")
    private String motivoCliente;

    @Column(columnDefinition = "TEXT")
    private String respuestaStaff;

    @Column(nullable = false)
    private Integer precioBase;

    @Column(nullable = false)
    private Integer recargo;

    @Column(nullable = false)
    private Integer montoTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoNegociacion estadoNegociacion;

    private UUID aprobadoPor;

    private OffsetDateTime fechaAprobacion;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();

        if (recargo == null)
            recargo = 0;
        if (estadoNegociacion == null)
            estadoNegociacion = EstadoNegociacion.SOLICITADA;
        if (montoTotal == null && precioBase != null)
            montoTotal = precioBase + recargo;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
        if (precioBase != null && recargo != null) {
            montoTotal = precioBase + recargo;
        }
    }
}