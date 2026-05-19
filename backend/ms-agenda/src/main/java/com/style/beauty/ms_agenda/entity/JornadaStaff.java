package com.style.beauty.ms_agenda.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "jornadas_staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JornadaStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idJornada;

    @Column(nullable = false)
    private UUID idStaff;

    @Column(nullable = false)
    private Integer diaSemana;

    @Column(nullable = false)
    private LocalTime horaInicio;

    @Column(nullable = false)
    private LocalTime horaFin;

    @Column(nullable = false)
    private Boolean activo;

    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
        if (activo == null)
            activo = true;
    }
}