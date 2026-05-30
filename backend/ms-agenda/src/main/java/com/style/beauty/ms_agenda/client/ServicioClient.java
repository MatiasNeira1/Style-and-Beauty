package com.style.beauty.ms_agenda.client;

import com.style.beauty.ms_agenda.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Component
public class ServicioClient {

    private final RestClient restClient;

    public ServicioClient(
            RestClient.Builder builder,
            @Value("${app.ms-catalogo.base-url:http://ms-catalogo:8083}") String catalogoBaseUrl) {
        this.restClient = builder.baseUrl(catalogoBaseUrl).build();
    }

    public ServicioResumen obtenerServicio(UUID idServicio) {
        try {
            ServicioResumen servicio = restClient.get()
                    .uri("/api/servicio/{idServicio}", idServicio)
                    .retrieve()
                    .body(ServicioResumen.class);

            if (servicio == null || servicio.duracionMinutos() == null || servicio.duracionMinutos() <= 0) {
                throw new BusinessException("Servicio no encontrado o sin duracion valida en ms-catalogo");
            }

            return servicio;
        } catch (RestClientException e) {
            throw new BusinessException("Servicio no encontrado en ms-catalogo");
        }
    }
}
