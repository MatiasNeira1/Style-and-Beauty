package com.style.beauty.ms_pagos.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CrearTransaccionRequest(
        UUID idCita,
        UUID idCliente,
        String descripcion,
        List<ReservaCarrito> reservas,
        List<ProductoCarrito> productos
) {

    public record ReservaCarrito(
            @NotNull UUID idCita
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


