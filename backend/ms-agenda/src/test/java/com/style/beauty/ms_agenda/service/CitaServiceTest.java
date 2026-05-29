package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.entity.JornadaStaff;
import com.style.beauty.ms_agenda.enums.EstadoCita;
import com.style.beauty.ms_agenda.enums.TipoCita;
import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.repository.BloqueoAgendaRepository;
import com.style.beauty.ms_agenda.repository.CitaRepository;
import com.style.beauty.ms_agenda.repository.HistorialCitaRepository;
import com.style.beauty.ms_agenda.repository.JornadaStaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CitaServiceTest {

    private static final UUID ID_CLIENTE = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID ID_STAFF = UUID.fromString("20000000-0000-0000-0000-000000000001");
    private static final UUID ID_SERVICIO = UUID.fromString("30000000-0000-0000-0000-000000000001");
    private static final LocalDate FECHA = LocalDate.of(2030, 1, 7);
    private static final ZoneId ZONE = ZoneId.of("America/Santiago");

    private CitaRepository citaRepository;
    private JornadaStaffRepository jornadaStaffRepository;
    private BloqueoAgendaRepository bloqueoAgendaRepository;
    private HistorialCitaRepository historialCitaRepository;
    private PerfilClient perfilClient;
    private ServicioClient servicioClient;
    private GoogleCalendarService googleCalendarService;
    private CitaService citaService;

    @BeforeEach
    void setUp() {
        citaRepository = mock(CitaRepository.class);
        jornadaStaffRepository = mock(JornadaStaffRepository.class);
        bloqueoAgendaRepository = mock(BloqueoAgendaRepository.class);
        historialCitaRepository = mock(HistorialCitaRepository.class);
        perfilClient = mock(PerfilClient.class);
        servicioClient = mock(ServicioClient.class);
        googleCalendarService = mock(GoogleCalendarService.class);

        citaService = new CitaService(
                citaRepository,
                jornadaStaffRepository,
                bloqueoAgendaRepository,
                historialCitaRepository,
                perfilClient,
                servicioClient,
                new HolguraService(),
                googleCalendarService);
        ReflectionTestUtils.setField(citaService, "agendaZone", "America/Santiago");

        when(perfilClient.obtenerCliente(ID_CLIENTE)).thenReturn(perfil(ID_CLIENTE, "Cliente", "Demo", "cliente@example.com"));
        when(perfilClient.obtenerStaff(ID_STAFF)).thenReturn(perfil(ID_STAFF, "Staff", "Demo", "staff@example.com"));
        when(servicioClient.obtenerServicio(ID_SERVICIO)).thenReturn(new ServicioResumen(ID_SERVICIO, "Corte", "Cabello", 60));
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, FECHA.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada(LocalTime.of(8, 0), LocalTime.of(13, 0))));
        when(bloqueoAgendaRepository.buscarBloqueosEnRango(any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());
        when(googleCalendarService.obtenerBloquesOcupados(any(), any(), any())).thenReturn(List.of());
        when(citaRepository.saveAndFlush(any(Cita.class))).thenAnswer(invocation -> {
            Cita cita = invocation.getArgument(0);
            if (cita.getIdCita() == null) {
                cita.setIdCita(UUID.randomUUID());
            }
            return cita;
        });
    }

    @Test
    void calculaDisponibilidadConDuracionYHolguraContraCitasExistentes() {
        Cita citaExistente = cita(at(10, 0), at(11, 0), at(11, 30));
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of(citaExistente));

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null));

        assertThat(slots).extracting(DisponibilidadSlot::inicio).contains(at(8, 30), at(11, 30));
        assertThat(slots).extracting(DisponibilidadSlot::inicio).doesNotContain(at(8, 45), at(10, 0), at(10, 30), at(11, 15));
    }

    @Test
    void rechazaCrearCitaSiGoogleCalendarTieneBloqueOcupado() {
        when(googleCalendarService.obtenerBloquesOcupados(any(), any(), any()))
                .thenReturn(List.of(new GoogleCalendarService.CalendarBusyBlock(at(9, 30), at(10, 30))));

        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 0), null, null, null);

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Google Calendar");
    }

    @Test
    void guardaCitaConDuracionHolguraYGoogleEventId() {
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());
        when(googleCalendarService.crearEvento(any(), any(), any(), any())).thenReturn("calendar-event-123");

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 0), null, null, "Test"));

        assertThat(creada.getFechaHoraFin()).isEqualTo(at(10, 0));
        assertThat(creada.getFechaHoraFinHolgura()).isEqualTo(at(10, 30));
        assertThat(creada.getDuracionServicioMin()).isEqualTo(60);
        assertThat(creada.getHolguraMin()).isEqualTo(30);
        assertThat(creada.getGoogleCalendarEventId()).isEqualTo("calendar-event-123");
        verify(googleCalendarService).crearEvento(any(), any(), any(), any());
    }

    private PerfilResumen perfil(UUID id, String nombre, String apellidos, String email) {
        return new PerfilResumen(id, "auth-" + id, "1-9", nombre, apellidos, email);
    }

    private JornadaStaff jornada(LocalTime inicio, LocalTime fin) {
        return JornadaStaff.builder()
                .idStaff(ID_STAFF)
                .diaSemana(FECHA.getDayOfWeek().getValue())
                .horaInicio(inicio)
                .horaFin(fin)
                .activo(true)
                .build();
    }

    private Cita cita(OffsetDateTime inicio, OffsetDateTime fin, OffsetDateTime finHolgura) {
        return Cita.builder()
                .idCliente(ID_CLIENTE)
                .idStaff(ID_STAFF)
                .idServicio(ID_SERVICIO)
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .fechaHoraFinHolgura(finHolgura)
                .duracionServicioMin(60)
                .holguraMin(30)
                .estadoCita(EstadoCita.PENDIENTE_PAGO)
                .tipoCita(TipoCita.NORMAL)
                .build();
    }

    private OffsetDateTime at(int hour, int minute) {
        return FECHA.atTime(hour, minute).atZone(ZONE).toOffsetDateTime();
    }
}
