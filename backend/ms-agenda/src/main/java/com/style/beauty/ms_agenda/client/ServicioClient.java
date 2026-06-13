package com.style.beauty.ms_agenda.client;

import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
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
            Map<String, Object> servicioData = restClient.get()
                    .uri("/api/servicio/{idServicio}", idServicio)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            ServicioResumen servicio = mapServicio(servicioData);
            validarServicio(servicio);

            return servicio;

        } catch (RestClientException e) {
            throw new BusinessException("No se pudo obtener el servicio desde ms-catalogo");
        }
    }

    public boolean staffRealizaServicio(UUID idServicio, UUID idStaff) {
        try {
            Boolean realizaServicio = restClient.get()
                    .uri("/api/servicio/{idServicio}/staff/{idStaff}/validar", idServicio, idStaff)
                    .retrieve()
                    .body(Boolean.class);

            return Boolean.TRUE.equals(realizaServicio);

        } catch (RestClientException e) {
            throw new BusinessException("No se pudo validar si el profesional realiza el servicio desde ms-catalogo");
        }
    }

    public List<ServicioStaffResumen> obtenerStaffPorServicio(UUID idServicio) {
        try {
            List<ServicioStaffResumen> staff = restClient.get()
                    .uri("/api/servicio/{idServicio}/staff", idServicio)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<ServicioStaffResumen>>() {
                    });

            return staff == null ? List.of() : staff;

        } catch (RestClientResponseException e) {
            if (isServicioNoEncontrado(e)) {
                throw new ResourceNotFoundException("Servicio no encontrado");
            }
            throw new BusinessException("No se pudo obtener el staff asociado al servicio desde ms-catalogo");
        } catch (RestClientException e) {
            throw new BusinessException("No se pudo obtener el staff asociado al servicio desde ms-catalogo");
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

        if (servicio.holguraMinutos() == null) {
            throw new BusinessException("El servicio no tiene holgura configurada en ms-catalogo");
        }

        if (servicio.holguraMinutos() < 0) {
            throw new BusinessException("La holgura del servicio no puede ser negativa");
        }

        if (servicio.holguraMinutos() >= servicio.duracionMinutos()) {
            throw new BusinessException("La holgura no puede ser igual o mayor a la duración del servicio");
        }
    }
}
