package com.style.beauty.ms_agenda.entity;

import com.style.beauty.ms_agenda.enums.TipoBloqueo;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bloqueos_agenda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloqueoAgenda {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idBloqueo;

    private UUID idStaff;

    @Column(nullable = false)
    private OffsetDateTime fechaHoraInicio;

    @Column(nullable = false)
    private OffsetDateTime fechaHoraFin;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoBloqueo tipoBloqueo;

    private UUID creadoPor;

    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
    }
}