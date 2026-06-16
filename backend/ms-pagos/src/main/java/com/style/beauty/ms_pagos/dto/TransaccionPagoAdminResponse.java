package com.style.beauty.ms_pagos.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TransaccionPagoAdminResponse(
        UUID idTransaccion,
        UUID idCita,
        String idCitas,
        UUID idCliente,
        BigDecimal monto,
        String buyOrder,
        String sessionId,
        String estado,
        String authorizationCode,
        String paymentTypeCode,
        Integer responseCode,
        OffsetDateTime transactionDate,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
