package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.entity.BloqueoAgenda;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.entity.JornadaStaff;
import com.style.beauty.ms_agenda.enums.EstadoCita;
import com.style.beauty.ms_agenda.enums.TipoBloqueo;
import com.style.beauty.ms_agenda.enums.TipoCita;
import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.repository.BloqueoAgendaRepository;
import com.style.beauty.ms_agenda.repository.CitaRepository;
import com.style.beauty.ms_agenda.repository.HistorialCitaRepository;
import com.style.beauty.ms_agenda.repository.JornadaStaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
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
import static org.mockito.Mockito.never;
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
        when(servicioClient.obtenerServicio(ID_SERVICIO)).thenReturn(new ServicioResumen(ID_SERVICIO, "Corte", "Cabello", 60, 30));
        when(servicioClient.staffRealizaServicio(ID_SERVICIO, ID_STAFF)).thenReturn(true);
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, FECHA.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada(LocalTime.of(8, 0), LocalTime.of(13, 0))));
        when(bloqueoAgendaRepository.buscarBloqueosEnRango(any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.saveAndFlush(any(Cita.class))).thenAnswer(invocation -> {
            Cita cita = invocation.getArgument(0);
            if (cita.getIdCita() == null) {
                cita.setIdCita(UUID.randomUUID());
            }
            return cita;
        });
    }

    @Test
    void calculaDisponibilidadSinCitasPreviasDentroDeJornada() {
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of());

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null));

        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .containsExactly(at(8, 0), at(9, 0), at(10, 0), at(11, 0), at(12, 0));
        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .doesNotContain(at(8, 15), at(8, 30), at(8, 45));
        assertThat(slots).extracting(DisponibilidadSlot::finVisible)
                .allMatch(fin -> !fin.isAfter(at(13, 0)));
    }

    @Test
    void disponibilidadAvanzaHastaFinVisibleCuandoElBloqueEstaDisponible() {
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Corte", "Cabello", 45, 15));
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, FECHA.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada(LocalTime.of(9, 0), LocalTime.of(18, 0))));
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of());

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null));

        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .containsExactly(
                        at(9, 0),
                        at(9, 45),
                        at(10, 30),
                        at(11, 15),
                        at(12, 0),
                        at(12, 45),
                        at(13, 30),
                        at(14, 15),
                        at(15, 0),
                        at(15, 45),
                        at(16, 30),
                        at(17, 15)
                );
        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .doesNotContain(at(9, 15), at(9, 30), at(10, 0), at(10, 15));
        assertThat(slots.get(0).finVisible()).isEqualTo(at(9, 45));
        assertThat(slots.get(0).finAtencion()).isEqualTo(at(9, 30));
    }

    @Test
    void rechazaDisponibilidadSiStaffNoRealizaServicio() {
        when(servicioClient.staffRealizaServicio(ID_SERVICIO, ID_STAFF)).thenReturn(false);

        assertThatThrownBy(() -> citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("El profesional no realiza el servicio seleccionado");

        verify(jornadaStaffRepository, never()).findByIdStaffAndDiaSemanaAndActivoTrue(any(), any());
    }

    @Test
    void disponibilidadUsaDuracionYHolguraDelCatalogoAunqueElRequestVengaManipulado() {
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Tratamiento capilar", "Peluqueria", 50, 30));
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of());

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(
                new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, 999, 0));

        assertThat(slots).isNotEmpty();
        assertThat(slots.get(0).finVisible()).isEqualTo(slots.get(0).inicio().plusMinutes(50));
        assertThat(slots.get(0).finAtencion()).isEqualTo(slots.get(0).inicio().plusMinutes(20));
    }

    @Test
    void calculaDisponibilidadConDuracionYHolguraContraCitasExistentes() {
        Cita citaExistente = cita(at(10, 0), at(10, 30), at(11, 0));
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of(citaExistente));

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null));

        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .containsExactly(at(8, 0), at(9, 0), at(11, 0), at(12, 0));
        assertThat(slots).extracting(DisponibilidadSlot::inicio).doesNotContain(at(9, 15), at(10, 0), at(10, 30));
    }

    @Test
    void excluyeSlotsQueSolapanBloqueosLocales() {
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of());
        when(bloqueoAgendaRepository.buscarBloqueosEnRango(any(), any(), any()))
                .thenReturn(List.of(bloqueo(at(9, 30), at(10, 30))));

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null));

        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .doesNotContain(at(9, 0), at(9, 30), at(10, 0), at(10, 15))
                .contains(at(10, 30));
    }

    @Test
    void rechazaCrearCitaDentroDeHolguraExistente() {
        Cita citaExistente = cita(at(9, 0), at(10, 0), at(10, 30));
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of(citaExistente));

        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(10, 15), null, null, null);

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("solapa");
    }

    @Test
    void rechazaCrearCitaSiStaffNoRealizaServicio() {
        when(servicioClient.staffRealizaServicio(ID_SERVICIO, ID_STAFF)).thenReturn(false);

        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 0), null, null, null);

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("El profesional no realiza el servicio seleccionado");

        verify(citaRepository, never()).saveAndFlush(any(Cita.class));
    }

    @Test
    void permiteCrearCitaExactamenteDespuesDeDuracionMasHolgura() {
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any()))
                .thenReturn(List.of(cita(at(9, 0), at(10, 0), at(10, 30))));

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(10, 30), null, null, null));

        assertThat(creada.getFechaHoraInicio()).isEqualTo(at(10, 30));
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(11, 30));
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(11, 0));
    }

    @Test
    void crearGuardaDuracionYHolguraCalculadasPorServicio() {
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Tratamiento capilar", "Peluqueria", 50, 30));

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(8, 0), 999, 0, null));

        assertThat(creada.getDuracionServicioMin()).isEqualTo(50);
        assertThat(creada.getHolguraMin()).isEqualTo(30);
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(8, 50));
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(8, 20));
    }

    @Test
    void crearCitaAjustaHolguraSiCatalogoTieneHolguraMayorALaDuracion() {
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Corte express", "Cabello", 20, 30));

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(8, 0), null, null, null));

        assertThat(creada.getDuracionServicioMin()).isEqualTo(20);
        assertThat(creada.getHolguraMin()).isEqualTo(15);
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(8, 20));
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(8, 5));
    }

    @Test
    void rechazaCrearCitaSiLaHoraNoCorrespondeAUnSlotDisponible() {
        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(8, 15), null, null, null);

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("horario seleccionado ya no esta disponible");

        verify(citaRepository, never()).saveAndFlush(any(Cita.class));
    }

    @Test
    void normalizaHoraRecibidaAUsoHorarioDeAgendaAntesDeGuardar() {
        OffsetDateTime inicioUtc = at(9, 0).withOffsetSameInstant(java.time.ZoneOffset.UTC);

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, inicioUtc, null, null, null));

        assertThat(creada.getFechaHoraInicio()).isEqualTo(at(9, 0));
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(10, 0));
    }

    @Test
    void propagaConflictoDeBaseDeDatosParaReservasSimultaneas() {
        when(citaRepository.saveAndFlush(any(Cita.class)))
                .thenThrow(new DataIntegrityViolationException("overlap"));

        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 0), null, null, null);

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("horario seleccionado ya no esta disponible");
    }

    @Test
    void rechazaCrearCitaFueraDeJornada() {
        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(12, 0), null, null, null);

        Cita creada = citaService.crear(request);

        assertThat(creada.getFechaHoraFin()).isEqualTo(at(13, 0));
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(12, 30));
    }

    @Test
    void guardaCitaConDuracionHolguraYGoogleEventId() {
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());
        when(googleCalendarService.crearEvento(any(), any(), any(), any())).thenReturn("calendar-event-123");

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 0), null, null, "Test"));

        assertThat(creada.getFechaHoraFin()).isEqualTo(at(10, 0));
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(9, 30));
        assertThat(creada.getDuracionServicioMin()).isEqualTo(60);
        assertThat(creada.getHolguraMin()).isEqualTo(30);
        assertThat(creada.getGoogleCalendarEventId()).isEqualTo("calendar-event-123");
        verify(googleCalendarService).crearEvento(any(), any(), any(), any());
    }

    @Test
    void creaCitaAunqueGoogleCalendarFalleYRegistraHistorial() {
        when(googleCalendarService.crearEvento(any(), any(), any(), any()))
                .thenThrow(new BusinessException("No fue posible crear el evento en Google Calendar"));

        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 0), null, null, null);

        Cita creada = citaService.crear(request);

        assertThat(creada.getGoogleCalendarEventId()).isNull();
        verify(citaRepository).saveAndFlush(any(Cita.class));
        verify(historialCitaRepository).save(any());
    }

    private PerfilResumen perfil(UUID id, String nombre, String apellidos, String email) {
        return new PerfilResumen(id, "auth-" + id, "1-9", nombre, apellidos, email, null, true);
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

    private BloqueoAgenda bloqueo(OffsetDateTime inicio, OffsetDateTime fin) {
        return BloqueoAgenda.builder()
                .idStaff(ID_STAFF)
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .motivo("Prueba")
                .tipoBloqueo(TipoBloqueo.STAFF)
                .build();
    }

    private Cita cita(OffsetDateTime inicio, OffsetDateTime finAtencion, OffsetDateTime finVisible) {
        return Cita.builder()
                .idCliente(ID_CLIENTE)
                .idStaff(ID_STAFF)
                .idServicio(ID_SERVICIO)
                .fechaHoraInicio(inicio)
                .fechaHoraFin(finVisible)
                .fechaHoraFinAtencion(finAtencion)
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
