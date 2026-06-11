package com.style.beauty.ms_pagos.client;

import com.style.beauty.ms_pagos.dto.ServicioCatalogoResumen;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class CatalogoClient {
    private final RestClient restClient;

    public CatalogoClient(
            RestClient.Builder builder,
            @Value("${ms.catalogo.base-url:http://localhost:8083}") String catalogoBaseUrl
    ) {
        this.restClient = builder.baseUrl(catalogoBaseUrl).build();
    }

    public ServicioCatalogoResumen obtenerServicio(UUID idServicio) {
        return restClient.get()
                .uri("/api/servicio/{idServicio}", idServicio)
                .retrieve()
                .body(ServicioCatalogoResumen.class);
    }
}
