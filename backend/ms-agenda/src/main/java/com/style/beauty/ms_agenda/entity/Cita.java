package com.style.beauty.ms_agenda.entity;

import com.style.beauty.ms_agenda.enums.EstadoCita;
import com.style.beauty.ms_agenda.enums.TipoCita;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
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
    //Fin visible para el cliente y fin real del bloque ocupado (incluye holgura)
    @Column(nullable = false)
    private OffsetDateTime fechaHoraFin;

    // Hora interna en que el profesional debe terminar la atención real
    @Column(nullable = false)
    private OffsetDateTime fechaHoraFinAtencion;

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

    @Column(precision = 12, scale = 2)
    private BigDecimal montoAbonado;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalEstimado;

    @Column(precision = 12, scale = 2)
    private BigDecimal saldoPendiente;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    private Integer calificacion;

    @Column(columnDefinition = "TEXT")
    private String comentarioCalificacion;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();

        if (estadoCita == null)
            estadoCita = EstadoCita.CONFIRMADA;
        if (tipoCita == null)
            tipoCita = TipoCita.NORMAL;
        
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
