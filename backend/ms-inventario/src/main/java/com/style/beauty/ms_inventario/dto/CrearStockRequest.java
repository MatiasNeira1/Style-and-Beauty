package com.style.beauty.ms_inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CrearStockRequest(
        @NotNull UUID idProducto,
        @NotNull Integer cantidadActual,
        @NotBlank String unidadMedida,
        Integer stockMinimo) {
}