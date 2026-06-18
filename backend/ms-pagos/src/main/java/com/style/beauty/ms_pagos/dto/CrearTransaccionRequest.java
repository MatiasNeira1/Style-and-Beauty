package com.style.beauty.ms_pagos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CrearTransaccionRequest(
        UUID idCita,
        UUID idCliente,
        String descripcion,
        BigDecimal total,
        List<ReservaCarrito> reservas,
        List<ProductoCarrito> productos
) {

    public record ReservaCarrito(
            @NotNull UUID idCita,
            @JsonAlias({"idServicio", "serviceId"})
            UUID servicioId,
            @JsonAlias({"idStaff", "staffId", "professionalId"})
            UUID profesionalId,
            @JsonAlias({"servicio", "serviceName", "nombreServicio"})
            String servicioNombre,
            @JsonAlias({"profesional", "professionalName", "nombreProfesional"})
            String profesionalNombre,
            String fecha,
            OffsetDateTime horaInicio,
            OffsetDateTime horaFin,
            BigDecimal precio,
            Integer duracionServicioMin,
            Integer holguraMin
    ) {
    }

    public record ProductoCarrito(
            @NotNull String idProducto,
            String nombre,
            @NotNull @Positive BigDecimal precio,
            @NotNull @Positive Integer cantidad
    ) {
    }
}


