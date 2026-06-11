package com.style.beauty.ms_pagos.client;
import com.style.beauty.ms_pagos.dto.CitaResumen;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.Map;
import java.util.UUID;


@Component
public class AgendaClient {
    private final RestClient restClient;

    public AgendaClient(
            RestClient.Builder builder,
            @Value("${ms.agenda.base-url:http://localhost:8084}") String agendaBaseUrl
    ) {
        this.restClient = builder.baseUrl(agendaBaseUrl).build();
    }

    public CitaResumen obtenerCita(UUID idCita) {
        return restClient.get()
                .uri("/api/agenda/citas/{idCita}", idCita)
                .retrieve()
                .body(CitaResumen.class);
    }

    public void confirmarCita(UUID idCita, UUID idTransaccionPago) {
        restClient.patch()
                .uri("/api/agenda/citas/{idCita}/estado", idCita)
                .body(Map.of(
                        "estadoCita", "CONFIRMADA",
                        "observacionStaff", "Pago Webpay confirmado. Transaccion: " + idTransaccionPago
                ))
                .retrieve()
                .toBodilessEntity();
    }

    public void rechazarCita(UUID idCita, String motivo) {
        restClient.patch()
                .uri("/api/agenda/citas/{idCita}/estado", idCita)
                .body(Map.of(
                        "estadoCita", "RECHAZADA",
                        "observacionStaff", motivo
                ))
                .retrieve()
                .toBodilessEntity();
    }

    public void expirarCita(UUID idCita, String motivo) {
        restClient.patch()
                .uri("/api/agenda/citas/{idCita}/estado", idCita)
                .body(Map.of(
                        "estadoCita", "EXPIRADA",
                        "observacionStaff", motivo
                ))
                .retrieve()
                .toBodilessEntity();
    }

}
