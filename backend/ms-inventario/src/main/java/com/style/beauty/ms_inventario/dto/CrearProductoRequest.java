package com.style.beauty.ms_inventario.dto;

import jakarta.validation.constraints.NotBlank;

public record CrearProductoRequest(
        @NotBlank String nombre,
        @NotBlank String categoria,
        String descripcion) {
}