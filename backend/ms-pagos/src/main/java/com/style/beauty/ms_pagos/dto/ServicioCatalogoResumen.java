package com.style.beauty.ms_pagos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.math.BigDecimal;
import java.util.UUID;

public record ServicioCatalogoResumen(
        @JsonAlias({"id_servicio", "idServicio", "id"})
        UUID idServicio,

        @JsonAlias({"precio_total", "precioTotal"})
        BigDecimal precioTotal
) {
}
