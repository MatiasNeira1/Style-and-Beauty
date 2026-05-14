package com.style.beauty.ms_inventario.dto;

import com.style.beauty.ms_inventario.enums.TipoMovimiento;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MovimientoStockRequest(
        @NotNull UUID idProducto,
        @NotNull TipoMovimiento tipoMovimiento,
        @NotNull Integer cantidad,
        String motivo,
        UUID usuarioResponsable) {
}