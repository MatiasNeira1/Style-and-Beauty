package com.style.beauty.ms_agenda.client;

import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.UUID;

@Component
public class PerfilClient {

    private final RestClient restClient;

    public PerfilClient(
            RestClient.Builder builder,
            @Value("${app.ms-perfiles.base-url:http://ms-perfiles:8082}") String perfilesBaseUrl) {
        this.restClient = builder.baseUrl(perfilesBaseUrl).build();
    }

    public PerfilResumen obtenerCliente(UUID idCliente) {
        return obtenerPerfil("/api/internal/perfiles/clientes/{idCliente}", idCliente, "Cliente no encontrado en ms-perfiles");
    }

    public PerfilResumen obtenerClientePorAuthId(String idAuth) {
        return obtenerPerfil("/api/internal/perfiles/clientes/auth/{idAuth}", idAuth, "Cliente autenticado no encontrado en ms-perfiles");
    }

    public PerfilResumen obtenerStaff(UUID idStaff) {
        return obtenerPerfil("/api/internal/perfiles/staff/{idStaff}", idStaff, "Staff no encontrado en ms-perfiles");
    }

    private PerfilResumen obtenerPerfil(String path, Object id, String mensajeError) {
        try {
            PerfilResumen perfil = restClient.get()
                    .uri(path, id)
                    .retrieve()
                    .body(PerfilResumen.class);

            if (perfil == null) {
                throw new ResourceNotFoundException(mensajeError);
            }

            return perfil;
        } catch (RestClientResponseException e) {
            if (HttpStatus.NOT_FOUND.value() == e.getStatusCode().value()) {
                throw new ResourceNotFoundException(mensajeError);
            }
            throw new BusinessException(mensajeError);
        } catch (RestClientException e) {
            throw new BusinessException(mensajeError);
        }
    }
}
