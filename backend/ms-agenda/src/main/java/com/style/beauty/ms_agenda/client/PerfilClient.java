package com.style.beauty.ms_agenda.client;

import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.UUID;

@Component
@Slf4j
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

    public PerfilResumen obtenerStaffPorAuthId(String idAuth) {
        return obtenerPerfil("/api/internal/perfiles/staff/auth/{idAuth}", idAuth, "Staff autenticado no encontrado en ms-perfiles");
    }

    public PerfilResumen obtenerStaff(UUID idStaff) {
        PerfilResumen staff = obtenerPerfil("/api/perfiles/staff/{idStaff}", idStaff, "Staff no encontrado en ms-perfiles");
        validarStaffId(idStaff, staff);
        return staff;
    }

    private PerfilResumen obtenerPerfil(String path, Object id, String mensajeError) {
        try {
            log.info("Solicitando perfil a ms-perfiles: path={}, id={}", path, id);

            PerfilResumen perfil = restClient.get()
                    .uri(path, id)
                    .retrieve()
                    .body(PerfilResumen.class);

            if (perfil == null) {
                throw new ResourceNotFoundException(mensajeError);
            }

            log.info("Perfil encontrado en ms-perfiles: path={}, id={}, idPersona={}",
                    path, id, perfil.idPersona());
            return perfil;
        } catch (RestClientResponseException e) {
            log.error("Error consultando ms-perfiles: path={}, id={}, status={}, body={}",
                    path, id, e.getStatusCode().value(), e.getResponseBodyAsString(), e);
            if (HttpStatus.NOT_FOUND.value() == e.getStatusCode().value()) {
                throw new ResourceNotFoundException(mensajeError, e);
            }
            throw new BusinessException(mensajeError, e);
        } catch (RestClientException e) {
            log.error("Error consultando ms-perfiles: path={}, id={}", path, id, e);
            throw new BusinessException(mensajeError, e);
        }
    }

    private void validarStaffId(UUID idStaff, PerfilResumen staff) {
        if (staff.idPersona() == null) {
            throw new BusinessException("ms-perfiles no devolvio idPersona para el staff solicitado");
        }

        if (!idStaff.equals(staff.idPersona())) {
            throw new BusinessException("El idStaff no coincide con idPersona devuelto por ms-perfiles");
        }
    }
}
