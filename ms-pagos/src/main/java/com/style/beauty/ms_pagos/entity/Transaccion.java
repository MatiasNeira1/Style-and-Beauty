package com.style.beauty.ms_pagos.entity;

import com.style.beauty.ms_pagos.enums.EstadoPago;
import com.style.beauty.ms_pagos.enums.TipoPago;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "transacciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaccion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idTransaccion;

    private UUID idCita;

    private UUID idCitaExtraordinaria;

    @Column(unique = true)
    private String codigoWebpay;

    private String tokenWebpay;

    @Column(nullable = false)
    private Integer montoTotal;

    @Column(nullable = false)
    private Integer montoAbono;

    @Column(nullable = false)
    private Integer montoRecargo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPago estadoPago;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPago tipoPago;

    private OffsetDateTime fechaPago;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();

        if (estadoPago == null)
            estadoPago = EstadoPago.INICIADA;
        if (montoAbono == null)
            montoAbono = 10000;
        if (montoRecargo == null)
            montoRecargo = 0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}