package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.entity.Cita;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GoogleCalendarServiceTest {

    @Test
    void crearEventoRetornaNullCuandoIntegracionEstaDeshabilitada() {
        GoogleCalendarService service = service(false, true);

        String eventId = service.crearEvento(new Cita(), perfil(), perfil(), servicio(), "calendar@test.cl");

        assertThat(eventId).isNull();
    }

    @Test
    void eliminarEventoNoConsultaApiCuandoIntegracionEstaDeshabilitada() {
        RestClient.Builder builder = mock(RestClient.Builder.class);
        RestClient restClient = mock(RestClient.class);
        when(builder.baseUrl(anyString())).thenReturn(builder);
        when(builder.build()).thenReturn(restClient);

        GoogleCalendarService service = new GoogleCalendarService(builder, false, true, "", "", "", "America/Santiago");

        service.eliminarEvento("calendar@test.cl", "event-1");

        verify(builder).baseUrl("https://www.googleapis.com/calendar/v3");
    }

    private GoogleCalendarService service(boolean enabled, boolean failOnError) {
        RestClient.Builder builder = mock(RestClient.Builder.class);
        when(builder.baseUrl(anyString())).thenReturn(builder);
        when(builder.build()).thenReturn(mock(RestClient.class));
        return new GoogleCalendarService(builder, enabled, failOnError, "", "", "", "America/Santiago");
    }

    private PerfilResumen perfil() {
        return new PerfilResumen(UUID.randomUUID(), "auth", "1-9", "Nombre", "Apellido", "staff@test.cl", null, true, 15);
    }

    private ServicioResumen servicio() {
        return new ServicioResumen(UUID.randomUUID(), "Corte", "Cabello", 60, 15);
    }
}
