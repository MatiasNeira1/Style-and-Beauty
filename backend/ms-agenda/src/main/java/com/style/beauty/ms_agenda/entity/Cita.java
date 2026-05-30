package com.style.beauty.ms_agenda.entity;

import com.style.beauty.ms_agenda.enums.EstadoCita;
import com.style.beauty.ms_agenda.enums.TipoCita;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "citas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idCita;

    @Column(nullable = false)
    private UUID idCliente;

    @Column(nullable = false)
    private UUID idStaff;

    @Column(nullable = false)
    private UUID idServicio;

    @Column(nullable = false)
    private OffsetDateTime fechaHoraInicio;

    @Column(nullable = false)
    private OffsetDateTime fechaHoraFin;

    @Column(nullable = false)
    private OffsetDateTime fechaHoraFinHolgura;

    @Column(nullable = false)
    private Integer duracionServicioMin;

    @Column(nullable = false)
    private Integer holguraMin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoCita estadoCita;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCita tipoCita;

    private OffsetDateTime expiracionReserva;

    private UUID idTransaccionPago;

    private String googleCalendarEventId;

    @Column(columnDefinition = "TEXT")
    private String observacionCliente;

    @Column(columnDefinition = "TEXT")
    private String observacionStaff;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();

        if (estadoCita == null)
            estadoCita = EstadoCita.PENDIENTE_PAGO;
        if (tipoCita == null)
            tipoCita = TipoCita.NORMAL;
        if (holguraMin == null)
            holguraMin = 20;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
