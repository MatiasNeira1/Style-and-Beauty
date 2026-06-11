package com.style.beauty.ms_pagos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.style.beauty.ms_pagos.enums.EstadoTransaccion;

@Data
@Entity
@Table(name = "transacciones_pago")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransaccionPago {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_transaccion", nullable = false, updatable = false)
    private UUID idTransaccion;

    @Column(name = "id_cita", nullable = false)
    private UUID idCita;

    @Column(name = "id_cliente", nullable = false)
    private UUID idCliente;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "buy_order", nullable = false, unique = true, length = 64)
    private String buyOrder;

    @Column(name = "session_id", nullable = false, length = 128)
    private String sessionId;

    @Column(name = "token_webpay", length = 256)
    private String tokenWebpay;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 32)
    private EstadoTransaccion estado;

    @Column(name = "authorization_code", length = 64)
    private String authorizationCode;

    @Column(name = "payment_type_code", length = 32)
    private String paymentTypeCode;

    @Column(name = "response_code")
    private Integer responseCode;

    @Column(name = "transaction_date")
    private OffsetDateTime transactionDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
         if (estado == null) {
            estado = EstadoTransaccion.CREADA;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
