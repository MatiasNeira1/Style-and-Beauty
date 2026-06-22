package com.style.beauty.ms_inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.UUID;

public record CrearStockRequest(
        @NotNull UUID idProducto,
        @NotNull @PositiveOrZero Integer cantidadActual,
        @NotBlank String unidadMedida,
        @PositiveOrZero
        Integer stockMinimo) {
}
