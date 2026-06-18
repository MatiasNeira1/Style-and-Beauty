package com.style.beauty.ms_agenda.client;

import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class ServicioClient {

    private final RestClient restClient;

    public ServicioClient(
            RestClient.Builder builder,
            @Value("${app.ms-catalogo.base-url:http://ms-catalogo:8083}") String catalogoBaseUrl
    ) {
        this.restClient = builder.baseUrl(catalogoBaseUrl).build();
    }

    public ServicioResumen obtenerServicio(UUID idServicio) {
        try {
            log.info("Solicitando servicio a ms-catalogo: idServicio={}", idServicio);

            Map<String, Object> servicioData = restClient.get()
                    .uri("/api/servicio/{idServicio}", idServicio)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            ServicioResumen servicio = mapServicio(servicioData);
            validarServicio(servicio);
            log.info("Servicio encontrado en ms-catalogo: idServicio={}, duracionMinutos={}, holguraMinutos={}, categoria={}",
                    servicio.idServicio(), servicio.duracionMinutos(), servicio.holguraMinutos(), servicio.categoria());

            return servicio;

        } catch (RestClientResponseException e) {
            log.error("Error consultando servicio en ms-catalogo: idServicio={}, status={}, body={}",
                    idServicio, e.getStatusCode().value(), e.getResponseBodyAsString(), e);
            throw new BusinessException("No se pudo obtener el servicio desde ms-catalogo", e);
        } catch (RestClientException e) {
            log.error("Error consultando servicio en ms-catalogo: idServicio={}", idServicio, e);
            throw new BusinessException("No se pudo obtener el servicio desde ms-catalogo", e);
        } catch (IllegalArgumentException e) {
            log.error("Respuesta invalida de ms-catalogo para servicio: idServicio={}", idServicio, e);
            throw new BusinessException("Respuesta invalida de ms-catalogo para el servicio", e);
        }
    }

    public boolean staffRealizaServicio(UUID idServicio, UUID idStaff) {
        try {
            log.info("Validando staff por servicio en ms-catalogo: idServicio={}, idStaff={}", idServicio, idStaff);

            Boolean realizaServicio = restClient.get()
                    .uri("/api/servicio/{idServicio}/staff/{idStaff}/validar", idServicio, idStaff)
                    .retrieve()
                    .body(Boolean.class);

            log.info("Validacion staff por servicio recibida: idServicio={}, idStaff={}, realizaServicio={}",
                    idServicio, idStaff, realizaServicio);
            return Boolean.TRUE.equals(realizaServicio);

        } catch (RestClientResponseException e) {
            log.error("Error validando staff por servicio en ms-catalogo: idServicio={}, idStaff={}, status={}, body={}",
                    idServicio, idStaff, e.getStatusCode().value(), e.getResponseBodyAsString(), e);
            throw new BusinessException("No se pudo validar si el profesional realiza el servicio desde ms-catalogo", e);
        } catch (RestClientException e) {
            log.error("Error validando staff por servicio en ms-catalogo: idServicio={}, idStaff={}",
                    idServicio, idStaff, e);
            throw new BusinessException("No se pudo validar si el profesional realiza el servicio desde ms-catalogo", e);
        }
    }

    public List<ServicioStaffResumen> obtenerStaffPorServicio(UUID idServicio) {
        try {
            log.info("Solicitando staff por servicio a ms-catalogo: idServicio={}", idServicio);

            List<ServicioStaffResumen> staff = restClient.get()
                    .uri("/api/servicio/{idServicio}/staff", idServicio)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<ServicioStaffResumen>>() {
                    });

            List<ServicioStaffResumen> staffSeguro = staff == null ? List.of() : staff;
            log.info("Staff por servicio recibido desde ms-catalogo: idServicio={}, cantidad={}",
                    idServicio, staffSeguro.size());
            return staffSeguro;

        } catch (RestClientResponseException e) {
            log.error("Error obteniendo staff por servicio desde ms-catalogo: idServicio={}, status={}, body={}",
                    idServicio, e.getStatusCode().value(), e.getResponseBodyAsString(), e);
            if (isServicioNoEncontrado(e)) {
                throw new ResourceNotFoundException("Servicio no encontrado", e);
            }
            throw new BusinessException("No se pudo obtener el staff asociado al servicio desde ms-catalogo", e);
        } catch (RestClientException e) {
            log.error("Error obteniendo staff por servicio desde ms-catalogo: idServicio={}", idServicio, e);
            throw new BusinessException("No se pudo obtener el staff asociado al servicio desde ms-catalogo", e);
        }
    }

    private boolean isServicioNoEncontrado(RestClientResponseException e) {
        String body = e.getResponseBodyAsString();
        return e.getStatusCode().value() == 404
                || (body != null && body.toLowerCase().contains("servicio no encontrado"));
    }

    private ServicioResumen mapServicio(Map<String, Object> servicioData) {
        if (servicioData == null) {
            return null;
        }

        return new ServicioResumen(
                readUuid(servicioData, "id_servicio", "idServicio", "id"),
                readString(servicioData, "nombre", "name"),
                readString(servicioData, "categoria", "category"),
                readInteger(servicioData, "duracion_minutos", "duracionMinutos", "duracionServicioMin", "duracion"),
                readInteger(servicioData, "holgura_minutos", "holguraMinutos", "holguraMin")
        );
    }

    private UUID readUuid(Map<String, Object> data, String... keys) {
        Object value = readValue(data, keys);
        if (value == null) {
            return null;
        }
        if (value instanceof UUID uuid) {
            return uuid;
        }
        return UUID.fromString(String.valueOf(value));
    }

    private String readString(Map<String, Object> data, String... keys) {
        Object value = readValue(data, keys);
        return value == null ? null : String.valueOf(value);
    }

    private Integer readInteger(Map<String, Object> data, String... keys) {
        Object value = readValue(data, keys);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.valueOf(String.valueOf(value));
    }

    private Object readValue(Map<String, Object> data, String... keys) {
        for (String key : keys) {
            if (data.containsKey(key)) {
                return data.get(key);
            }
        }
        return null;
    }

    private void validarServicio(ServicioResumen servicio) {

        if (servicio == null) {
            throw new BusinessException("Servicio no encontrado en ms-catalogo");
        }

        if (servicio.duracionMinutos() == null || servicio.duracionMinutos() <= 0) {
            throw new BusinessException("El servicio no tiene una duración válida configurada en ms-catalogo");
        }

        if (servicio.holguraMinutos() != null && servicio.holguraMinutos() < 0) {
            throw new BusinessException("La holgura del servicio no puede ser negativa");
        }
    }
}
