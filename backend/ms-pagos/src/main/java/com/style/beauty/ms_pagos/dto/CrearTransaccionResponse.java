package com.style.beauty.ms_pagos.dto;
import java.util.UUID;

public record CrearTransaccionResponse(
        UUID idTransaccion,
        UUID idCita,
        String token,
        String urlWebpay

) {

}
