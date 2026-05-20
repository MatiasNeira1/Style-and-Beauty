package com.style.beauty.ms_agenda.entity;

import com.style.beauty.ms_agenda.enums.AccionHistorial;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "historial_citas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialCita {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idHistorial;

    @Column(nullable = false)
    private UUID idCita;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccionHistorial accion;

    private String estadoAnterior;

    private String estadoNuevo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    private UUID usuarioResponsable;

    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
    }
}