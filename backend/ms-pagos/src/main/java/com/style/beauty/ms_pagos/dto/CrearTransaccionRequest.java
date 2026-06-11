package com.style.beauty.ms_pagos.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CrearTransaccionRequest(
        @NotNull UUID idCita,
        String descripcion
) {

}


