package com.style.beauty.ms_agenda.service;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GoogleCalendarService {

    private static final String CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
    private static final String GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

    private final RestClient restClient;
    private final boolean enabled;
    private final boolean failOnError;
    private final String credentialsJson;
    private final String credentialsPath;
    private final String defaultCalendarId;
    private final String agendaZone;

    private GoogleCredentials credentials;

    public GoogleCalendarService(
            RestClient.Builder builder,
            @Value("${app.google-calendar.enabled:false}") boolean enabled,
            @Value("${app.google-calendar.fail-on-error:true}") boolean failOnError,
            @Value("${app.google-calendar.credentials-json:}") String credentialsJson,
            @Value("${app.google-calendar.credentials-path:}") String credentialsPath,
            @Value("${app.google-calendar.default-calendar-id:}") String defaultCalendarId,
            @Value("${app.agenda.zone:America/Santiago}") String agendaZone) {
        this.restClient = builder.baseUrl(GOOGLE_CALENDAR_API).build();
        this.enabled = enabled;
        this.failOnError = failOnError;
        this.credentialsJson = credentialsJson;
        this.credentialsPath = credentialsPath;
        this.defaultCalendarId = defaultCalendarId;
        this.agendaZone = agendaZone;
    }

    

    public String crearEvento(Cita cita, PerfilResumen cliente, PerfilResumen staff, ServicioResumen servicio) {
        if (!enabled) {
            return null;
        }

        String calendarId = calendarId(staff);
        if (!StringUtils.hasText(calendarId)) {
            manejarError("El staff no tiene calendarId/emailContacto para crear evento en Google Calendar", null);
            return null;
        }

        try {
            String clienteNombre = nombreCompleto(cliente);
            String staffNombre = nombreCompleto(staff);
            String servicioNombre = StringUtils.hasText(servicio.nombre()) ? servicio.nombre() : "Servicio";

            Map<String, Object> body = Map.of(
                    "summary", "Style & Beauty - " + servicioNombre,
                    "description", "Cliente: " + clienteNombre + "\nProfesional: " + staffNombre,
                    "start", Map.of("dateTime", cita.getFechaHoraInicio().toString(), "timeZone", agendaZone),
                    "end", Map.of("dateTime", cita.getFechaHoraFin().toString(), "timeZone", agendaZone));

            Map<?, ?> response = restClient.post()
                    .uri("/calendars/{calendarId}/events", calendarId)
                    .header("Authorization", "Bearer " + accessToken())
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            Object id = response == null ? null : response.get("id");
            return id == null ? null : id.toString();
        } catch (RestClientException | IOException e) {
            manejarError("No fue posible crear el evento en Google Calendar", e);
            return null;
        }
    }

    private String calendarId(PerfilResumen staff) {
        if (staff != null && StringUtils.hasText(staff.emailContacto())) {
            return staff.emailContacto();
        }
        return defaultCalendarId;
    }

    private String accessToken() throws IOException {
        GoogleCredentials activeCredentials = credentials();
        activeCredentials.refreshIfExpired();
        AccessToken token = activeCredentials.getAccessToken();
        if (token == null || !StringUtils.hasText(token.getTokenValue())) {
            throw new IOException("Google credentials sin access token");
        }
        return token.getTokenValue();
    }

    private synchronized GoogleCredentials credentials() throws IOException {
        if (credentials != null) {
            return credentials;
        }

        String json = firstText(credentialsJson, System.getenv("GOOGLE_CALENDAR_CREDENTIALS_JSON"));
        if (StringUtils.hasText(json)) {
            credentials = GoogleCredentials
                    .fromStream(new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8)))
                    .createScoped(CALENDAR_SCOPE);
            return credentials;
        }

        String path = firstText(
                credentialsPath,
                System.getenv("GOOGLE_CALENDAR_CREDENTIALS_PATH"),
                System.getenv("GOOGLE_APPLICATION_CREDENTIALS"));
        if (StringUtils.hasText(path)) {
            try (FileInputStream input = new FileInputStream(path)) {
                credentials = GoogleCredentials.fromStream(input).createScoped(CALENDAR_SCOPE);
                return credentials;
            }
        }

        credentials = GoogleCredentials.getApplicationDefault().createScoped(CALENDAR_SCOPE);
        return credentials;
    }

    @SuppressWarnings("unchecked")
    private List<CalendarBusyBlock> parseBusyBlocks(Map<?, ?> response, String calendarId) {
        if (response == null) {
            return List.of();
        }

        Object calendarsValue = response.get("calendars");
        if (!(calendarsValue instanceof Map<?, ?> calendars)) {
            return List.of();
        }

        Object calendarValue = calendars.get(calendarId);
        if (!(calendarValue instanceof Map<?, ?> calendar)) {
            return List.of();
        }

        Object busyValue = calendar.get("busy");
        if (!(busyValue instanceof List<?> busyItems)) {
            return List.of();
        }

        List<CalendarBusyBlock> busyBlocks = new ArrayList<>();
        for (Object item : busyItems) {
            if (!(item instanceof Map<?, ?> busy)) {
                continue;
            }
            Object start = busy.get("start");
            Object end = busy.get("end");
            if (start == null || end == null) {
                continue;
            }
            busyBlocks.add(new CalendarBusyBlock(OffsetDateTime.parse(start.toString()), OffsetDateTime.parse(end.toString())));
        }
        return busyBlocks;
    }

    private String nombreCompleto(PerfilResumen perfil) {
        if (perfil == null) {
            return "No informado";
        }
        return (safe(perfil.nombre()) + " " + safe(perfil.apellidos())).trim();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return "";
    }

    private void manejarError(String message, Exception cause) {
        if (failOnError) {
            throw cause == null ? new BusinessException(message) : new BusinessException(message + ": " + cause.getMessage());
        }
    }

    public record CalendarBusyBlock(OffsetDateTime inicio, OffsetDateTime fin) {
    }
}
