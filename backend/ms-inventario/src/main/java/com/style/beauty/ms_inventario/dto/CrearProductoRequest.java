package com.style.beauty.ms_inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CrearProductoRequest(
        @NotBlank String nombre,
        @NotBlank String categoria,
        String descripcion,
        @NotNull @PositiveOrZero BigDecimal precio) {
}
