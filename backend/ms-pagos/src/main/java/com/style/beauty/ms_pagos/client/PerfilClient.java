package com.style.beauty.ms_pagos.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class PerfilClient {
    private final RestClient restClient;

    public PerfilClient(
            RestClient.Builder builder,
            @Value("${ms.perfiles.base-url}") String perfilesBaseUrl
    ) {
        this.restClient = builder.baseUrl(perfilesBaseUrl).build();
    }

    public void acumularPuntosFidelidad(UUID idCliente, int puntos) {
        restClient.patch()
                .uri((builder) -> builder
                        .path("/api/internal/perfiles/clientes/{idCliente}/puntos-fidelidad")
                        .queryParam("puntos", puntos)
                        .build(idCliente))
                .retrieve()
                .toBodilessEntity();
    }
}
