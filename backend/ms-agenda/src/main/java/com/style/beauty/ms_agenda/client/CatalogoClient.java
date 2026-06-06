package com.style.beauty.ms_agenda.client;

import com.style.beauty.ms_agenda.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Component
public class CatalogoClient {

    private final RestClient restClient;

    public CatalogoClient(
            RestClient.Builder builder,
            @Value("${app.ms-catalogo.base-url:http://localhost:8083}") String catalogoBaseUrl) {
        this.restClient = builder.baseUrl(catalogoBaseUrl).build();
    }

    public ServicioResumen obtenerServicio(UUID idServicio) {
        try {
            ServicioResumen servicio = restClient.get()
                    .uri("/api/servicio/{idServicio}", idServicio)
                    .retrieve()
                    .body(ServicioResumen.class);

            if (servicio == null) {
                throw new BusinessException("Servicio no encontrado en ms-catalogo");
            }

            return servicio;
        } catch (RestClientException e) {
            throw new BusinessException("Servicio no encontrado en ms-catalogo");
        }
    }
}
