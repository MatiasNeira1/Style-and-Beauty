package com.style.beauty.ms_pagos.dto;

import java.util.UUID;

public record CitaResumen(
        UUID idCita,
        UUID idCliente,
        UUID idServicio,
        String estadoCita
) {
}
