package com.style.beauty.ms_pagos.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmarPagoRequest(
        @NotBlank String codigoWebpay,
        @NotBlank String tokenWebpay) {
}