package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.dto.CitaAgendaResponse;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.dto.ProximaCitaClienteResponse;
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
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CitaServiceTest {

    private static final UUID ID_CLIENTE = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID ID_CLIENTE_OTRO = UUID.fromString("10000000-0000-0000-0000-000000000002");
    private static final UUID ID_STAFF = UUID.fromString("20000000-0000-0000-0000-000000000001");
    private static final UUID ID_STAFF_ANTERIOR = UUID.fromString("20000000-0000-0000-0000-000000000002");
    private static final UUID ID_SERVICIO = UUID.fromString("30000000-0000-0000-0000-000000000001");
    private static final LocalDate FECHA = LocalDate.of(2030, 1, 7);
    private static final ZoneId ZONE = ZoneId.of("America/Santiago");

    private CitaRepository citaRepository;
    private JornadaStaffRepository jornadaStaffRepository;
    private BloqueoAgendaRepository bloqueoAgendaRepository;
    private HistorialCitaRepository historialCitaRepository;
    private PerfilClient perfilClient;
    private ServicioClient servicioClient;
    private CitaService citaService;

    @BeforeEach
    void setUp() {
        citaRepository = mock(CitaRepository.class);
        jornadaStaffRepository = mock(JornadaStaffRepository.class);
        bloqueoAgendaRepository = mock(BloqueoAgendaRepository.class);
        historialCitaRepository = mock(HistorialCitaRepository.class);
        perfilClient = mock(PerfilClient.class);
        servicioClient = mock(ServicioClient.class);

        citaService = new CitaService(
                citaRepository,
                jornadaStaffRepository,
                bloqueoAgendaRepository,
                historialCitaRepository,
                perfilClient,
                servicioClient,
                new HolguraService());
        ReflectionTestUtils.setField(citaService, "agendaZone", "America/Santiago");
        ReflectionTestUtils.setField(citaService, "maxDiasAnticipacion", 2000);
        ReflectionTestUtils.setField(citaService, "minutosReservaTemporal", 15);

        when(perfilClient.obtenerCliente(ID_CLIENTE)).thenReturn(perfil(ID_CLIENTE, "Cliente", "Demo", "cliente@example.com"));
        when(perfilClient.obtenerStaff(ID_STAFF)).thenReturn(perfil(ID_STAFF, "Staff", "Demo", "staff@example.com"));
        when(servicioClient.obtenerServicio(ID_SERVICIO)).thenReturn(new ServicioResumen(ID_SERVICIO, "Corte", "Cabello", 60, 30));
        when(servicioClient.staffRealizaServicio(ID_SERVICIO, ID_STAFF)).thenReturn(true);
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, FECHA.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada(LocalTime.of(8, 0), LocalTime.of(13, 0))));
        when(bloqueoAgendaRepository.buscarBloqueosEnRango(any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarChoquesCliente(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarCitasClienteEnRango(any(), any(), any(), any())).thenReturn(List.of());
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
                .containsExactly(at(8, 0), at(9, 30), at(11, 0));
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
                        at(10, 0),
                        at(11, 0),
                        at(12, 0),
                        at(13, 0),
                        at(14, 0),
                        at(15, 0),
                        at(16, 0),
                        at(17, 0)
                );
        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .doesNotContain(at(9, 15), at(9, 30), at(9, 45), at(10, 15));
        assertThat(slots.get(0).finVisible()).isEqualTo(at(10, 0));
        assertThat(slots.get(0).finAtencion()).isEqualTo(at(9, 45));
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
        assertThat(slots.get(0).finAtencion()).isEqualTo(slots.get(0).inicio().plusMinutes(50));
        assertThat(slots.get(0).finVisible()).isEqualTo(slots.get(0).inicio().plusMinutes(80));
    }

    @Test
    void calculaDisponibilidadConDuracionYHolguraContraCitasExistentes() {
        Cita citaExistente = cita(at(10, 0), at(10, 30), at(11, 0));
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of(citaExistente));

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null));

        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .containsExactly(at(8, 0), at(11, 0));
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
                .hasMessageContaining("profesional ya tiene una cita");
    }

    @Test
    void rechazaCrearCitaSiClienteTieneCitaSolapada() {
        Cita citaExistente = cita(at(9, 0), at(10, 0), at(10, 30));
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarChoquesCliente(any(), any(), any(), any())).thenReturn(List.of(citaExistente));

        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 30), null, null, null);

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ya tienes una cita");
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
        Cita citaExistente = cita(at(9, 0), at(10, 0), at(10, 30));
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarChoquesCliente(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any()))
                .thenReturn(List.of(citaExistente));
        when(citaRepository.buscarCitasClienteEnRango(any(), any(), any(), any()))
                .thenReturn(List.of(citaExistente));

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(10, 30), null, null, null));

        assertThat(creada.getFechaHoraInicio()).isEqualTo(at(10, 30));
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(11, 30));
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(12, 0));
    }

    @Test
    void crearGuardaDuracionYHolguraCalculadasPorServicio() {
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Tratamiento capilar", "Peluqueria", 50, 30));

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(8, 0), 999, 0, null));

        assertThat(creada.getDuracionServicioMin()).isEqualTo(50);
        assertThat(creada.getHolguraMin()).isEqualTo(30);
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(8, 50));
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(9, 20));
    }

    @Test
    void crearCitaAjustaHolguraSiCatalogoTieneHolguraMayorALaDuracion() {
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Corte express", "Cabello", 20, 30));

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(8, 0), null, null, null));

        assertThat(creada.getDuracionServicioMin()).isEqualTo(20);
        assertThat(creada.getHolguraMin()).isEqualTo(15);
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(8, 20));
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(8, 35));
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
        OffsetDateTime inicioUtc = at(9, 30).withOffsetSameInstant(java.time.ZoneOffset.UTC);

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, inicioUtc, null, null, null));

        assertThat(creada.getFechaHoraInicio()).isEqualTo(at(9, 30));
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(10, 30));
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(11, 0));
    }

    @Test
    void propagaConflictoDeBaseDeDatosParaReservasSimultaneas() {
        when(citaRepository.saveAndFlush(any(Cita.class)))
                .thenThrow(new DataIntegrityViolationException("overlap"));

        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 30), null, null, null);

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("horario seleccionado ya no esta disponible");
    }

    @Test
    void rechazaCrearCitaSiBloqueConHolguraQuedaFueraDeJornada() {
        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(12, 0), null, null, null);

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("jornada");
    }

    @Test
    void crearGeneraReservaTemporalConExpiracionSinGoogleCalendar() {
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 30), null, null, "Test"));

        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(10, 30));
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(11, 0));
        assertThat(creada.getDuracionServicioMin()).isEqualTo(60);
        assertThat(creada.getHolguraMin()).isEqualTo(30);
        assertThat(creada.getEstadoCita()).isEqualTo(EstadoCita.PENDIENTE_PAGO);
        assertThat(creada.getExpiracionReserva()).isAfter(OffsetDateTime.now(ZONE).plusMinutes(14));
        assertThat(creada.getExpiracionReserva()).isBefore(OffsetDateTime.now(ZONE).plusMinutes(16));
        assertThat(creada.getGoogleCalendarEventId()).isNull();
        verify(citaRepository).actualizarExpiracionReservasPendientesCliente(
                eq(ID_CLIENTE),
                eq(EstadoCita.PENDIENTE_PAGO),
                any(OffsetDateTime.class)
        );
    }

    @Test
    void rechazaDisponibilidadEnFechaPasada() {
        LocalDate ayer = LocalDate.now(ZONE).minusDays(1);

        assertThatThrownBy(() -> citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, ayer, null, null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("anteriores a hoy");
    }

    @Test
    void rechazaDisponibilidadMasAllaDeTreintaDias() {
        ReflectionTestUtils.setField(citaService, "maxDiasAnticipacion", 30);
        LocalDate fueraDeRango = LocalDate.now(ZONE).plusDays(31);

        assertThatThrownBy(() -> citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, fueraDeRango, null, null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("30");
    }

    @Test
    void rechazaDisponibilidadDomingo() {
        LocalDate domingo = LocalDate.now(ZONE).with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        assertThatThrownBy(() -> citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, domingo, null, null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("domingos");
    }

    @Test
    void disponibilidadSabadoRespetaCierreA16() {
        LocalDate sabado = LocalDate.of(2030, 1, 12);
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, sabado.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada(sabado, LocalTime.of(8, 0), LocalTime.of(18, 0))));

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, sabado, null, null));

        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .containsExactly(at(sabado, 8, 0), at(sabado, 9, 30), at(sabado, 11, 0), at(sabado, 12, 30), at(sabado, 14, 0));
        assertThat(slots).allMatch(slot -> !slot.finVisible().toLocalTime().isAfter(LocalTime.of(16, 0)));
    }

    @Test
    void rechazaCrearCitaSabadoDespuesDe16() {
        LocalDate sabado = LocalDate.of(2030, 1, 12);
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, sabado.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada(sabado, LocalTime.of(8, 0), LocalTime.of(18, 0))));

        CrearCitaRequest request = new CrearCitaRequest(
                ID_CLIENTE,
                ID_STAFF,
                ID_SERVICIO,
                at(sabado, 15, 0),
                null,
                null,
                null
        );

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("16:00");
    }

    @Test
    void disponibilidadConClienteSoloDevuelveSlotConsecutivo() {
        Cita citaExistente = cita(at(9, 0), at(10, 0), at(10, 30));
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of(citaExistente));
        when(citaRepository.buscarCitasClienteEnRango(any(), any(), any(), any())).thenReturn(List.of(citaExistente));

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(
                new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null, ID_CLIENTE));

        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .containsExactly(at(10, 30));
    }

    @Test
    void disponibilidadConClienteNoBloqueaDiaSiSlotConsecutivoNoAlineaConGrillaDelStaff() {
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Manicure", "Nails", 45, 15));
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, FECHA.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada(LocalTime.of(9, 0), LocalTime.of(18, 0))));

        Cita citaAnterior = cita(ID_CLIENTE, ID_STAFF_ANTERIOR, at(9, 0), at(10, 0), at(10, 15), 60, 15);
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarCitasClienteEnRango(any(), any(), any(), any())).thenReturn(List.of(citaAnterior));

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(
                new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null, ID_CLIENTE));

        assertThat(slots).extracting(DisponibilidadSlot::inicio)
                .containsExactly(at(10, 15));
        assertThat(slots.get(0).finAtencion()).isEqualTo(at(11, 0));
        assertThat(slots.get(0).finVisible()).isEqualTo(at(11, 15));
    }

    @Test
    void disponibilidadConClienteDevuelveVacioSiStaffNoTieneSlotConsecutivo() {
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Manicure", "Nails", 45, 15));
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, FECHA.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada(LocalTime.of(9, 0), LocalTime.of(18, 0))));

        Cita citaAnterior = cita(ID_CLIENTE, ID_STAFF_ANTERIOR, at(9, 0), at(10, 0), at(10, 15), 60, 15);
        Cita citaStaff = cita(ID_CLIENTE_OTRO, ID_STAFF, at(10, 0), at(10, 45), at(11, 15), 45, 30);
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of(citaStaff));
        when(citaRepository.buscarCitasClienteEnRango(any(), any(), any(), any())).thenReturn(List.of(citaAnterior));

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(
                new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null, ID_CLIENTE));

        assertThat(slots).isEmpty();
    }

    @Test
    void crearPermiteCitaConsecutivaAunqueNoAlineeConGrillaNormalDelStaff() {
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Manicure", "Nails", 45, 15));
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, FECHA.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada(LocalTime.of(9, 0), LocalTime.of(18, 0))));

        Cita citaAnterior = cita(ID_CLIENTE, ID_STAFF_ANTERIOR, at(9, 0), at(10, 0), at(10, 15), 60, 15);
        when(citaRepository.buscarChoquesAgenda(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarChoquesCliente(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarCitasEnRango(any(), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarCitasClienteEnRango(any(), any(), any(), any())).thenReturn(List.of(citaAnterior));

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(10, 15), null, null, null));

        assertThat(creada.getFechaHoraInicio()).isEqualTo(at(10, 15));
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(11, 0));
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(11, 15));
    }

    @Test
    void rechazaCitaMismoDiaNoConsecutiva() {
        Cita citaExistente = cita(at(9, 0), at(10, 0), at(10, 30));
        when(citaRepository.buscarCitasClienteEnRango(any(), any(), any(), any())).thenReturn(List.of(citaExistente));

        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(11, 0), null, null, null);

        assertThatThrownBy(() -> citaService.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("consecutivo");
    }

    @Test
    void crearUsaHolguraStaffCuandoServicioNoTieneHolguraNiCategoriaConocida() {
        when(perfilClient.obtenerStaff(ID_STAFF)).thenReturn(
                new PerfilResumen(ID_STAFF, "auth-staff", "1-9", "Staff", "Demo", "staff@example.com", null, true, 10));
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Diagnostico", "Otra", 45, null));

        Cita creada = citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(8, 0), null, null, null));

        assertThat(creada.getHolguraMin()).isEqualTo(10);
        assertThat(creada.getFechaHoraFinAtencion()).isEqualTo(at(8, 45));
        assertThat(creada.getFechaHoraFin()).isEqualTo(at(8, 55));
    }

    @Test
    void creaCitaTemporalYRegistraHistorial() {
        CrearCitaRequest request = new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, at(9, 30), null, null, null);

        Cita creada = citaService.crear(request);

        assertThat(creada.getEstadoCita()).isEqualTo(EstadoCita.PENDIENTE_PAGO);
        assertThat(creada.getGoogleCalendarEventId()).isNull();
        verify(citaRepository).saveAndFlush(any(Cita.class));
        verify(historialCitaRepository).save(any());
    }

    @Test
    void liberarReservasVencidasMarcaPendientesComoExpiradas() {
        citaService.liberarReservasVencidas();

        verify(citaRepository).expirarReservasVencidas(
                eq(EstadoCita.PENDIENTE_PAGO),
                eq(EstadoCita.EXPIRADA),
                any(OffsetDateTime.class)
        );
    }

    @Test
    void listarProximasClienteExcluyeEstadosIgnoradosYMapeaDetalle() {
        Cita cita = cita(at(9, 0), at(10, 0), at(10, 15));
        cita.setIdCita(UUID.randomUUID());
        cita.setEstadoCita(EstadoCita.CONFIRMADA);
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Uñas permanentes", "Nails", 60, 15, BigDecimal.valueOf(28_990)));
        when(perfilClient.obtenerStaff(ID_STAFF)).thenReturn(perfil(ID_STAFF, "Camila", "Rojas", "staff@example.com"));
        when(citaRepository.buscarProximasCitasCliente(eq(ID_CLIENTE), any(OffsetDateTime.class), any()))
                .thenReturn(List.of(cita));

        List<ProximaCitaClienteResponse> proximas = citaService.listarProximasCliente(ID_CLIENTE);

        assertThat(proximas).hasSize(1);
        assertThat(proximas.get(0).servicioNombre()).isEqualTo("Uñas permanentes");
        assertThat(proximas.get(0).profesionalNombre()).isEqualTo("Camila Rojas");
        assertThat(proximas.get(0).estadoCita()).isEqualTo("CONFIRMADA");
        assertThat(proximas.get(0).valorServicio()).isEqualByComparingTo("28990");
        assertThat(proximas.get(0).abonoReserva()).isEqualByComparingTo("10000");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<EstadoCita>> estadosCaptor = ArgumentCaptor.forClass(List.class);
        verify(citaRepository).buscarProximasCitasCliente(eq(ID_CLIENTE), any(OffsetDateTime.class), estadosCaptor.capture());
        assertThat(estadosCaptor.getValue()).containsExactly(
                EstadoCita.CANCELADA,
                EstadoCita.EXPIRADA,
                EstadoCita.RECHAZADA
        );
    }

    @Test
    void listarAgendaStaffDevuelveCitasDelStaffConNombres() {
        Cita cita = cita(at(9, 0), at(10, 0), at(10, 15));
        cita.setIdCita(UUID.randomUUID());
        cita.setEstadoCita(EstadoCita.CONFIRMADA);
        when(citaRepository.findByIdStaff(ID_STAFF)).thenReturn(List.of(cita));
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Corte mujer", "Cabello", 60, 15));
        when(perfilClient.obtenerCliente(ID_CLIENTE))
                .thenReturn(perfil(ID_CLIENTE, "Cliente", "Agenda", "cliente@example.com"));

        List<CitaAgendaResponse> citas = citaService.listarAgendaStaff(ID_STAFF);

        assertThat(citas).hasSize(1);
        assertThat(citas.get(0).idStaff()).isEqualTo(ID_STAFF);
        assertThat(citas.get(0).nombreCliente()).isEqualTo("Cliente Agenda");
        assertThat(citas.get(0).nombreServicio()).isEqualTo("Corte mujer");
        verify(citaRepository).findByIdStaff(ID_STAFF);
    }

    @Test
    void finalizarCitaStaffMarcaFinalizadaYRegistraHistorial() {
        UUID idCita = UUID.randomUUID();
        Cita cita = cita(at(9, 0), at(10, 0), at(10, 15));
        cita.setIdCita(idCita);
        cita.setEstadoCita(EstadoCita.CONFIRMADA);
        when(citaRepository.findById(idCita)).thenReturn(Optional.of(cita));
        when(citaRepository.save(any(Cita.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Cita finalizada = citaService.finalizarCitaStaff(idCita, ID_STAFF);

        assertThat(finalizada.getEstadoCita()).isEqualTo(EstadoCita.FINALIZADA);
        assertThat(finalizada.getExpiracionReserva()).isNull();
        assertThat(finalizada.getObservacionStaff()).isEqualTo("Cita finalizada por staff.");
        verify(historialCitaRepository).save(any());
    }

    @Test
    void finalizarCitaStaffRechazaCitaDeOtroProfesional() {
        UUID idCita = UUID.randomUUID();
        Cita cita = cita(ID_CLIENTE, ID_STAFF_ANTERIOR, at(9, 0), at(10, 0), at(10, 15), 60, 15);
        cita.setIdCita(idCita);
        cita.setEstadoCita(EstadoCita.CONFIRMADA);
        when(citaRepository.findById(idCita)).thenReturn(Optional.of(cita));

        assertThatThrownBy(() -> citaService.finalizarCitaStaff(idCita, ID_STAFF))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("otro profesional");
      
    void listarPorClientePermiteFiltrosNulosYMapeaLaRespuesta() {
        Cita cita = cita(at(9, 0), at(10, 0), at(10, 30));
        cita.setIdCita(UUID.randomUUID());
        cita.setEstadoCita(EstadoCita.CONFIRMADA);
        when(citaRepository.buscarCitasPorCliente(ID_CLIENTE, null, null, null))
                .thenReturn(List.of(cita));

        List<CitaAgendaResponse> resultado = citaService.listarPorCliente(ID_CLIENTE, null, null, null);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombreCliente()).isEqualTo("Cliente Demo");
        assertThat(resultado.get(0).nombreServicio()).isEqualTo("Corte");
        verify(citaRepository).buscarCitasPorCliente(ID_CLIENTE, null, null, null);
    }

    @Test
    void listarPorStaffConvierteRangoInclusivoYAplicaEstado() {
        LocalDate hasta = FECHA.plusDays(2);
        when(citaRepository.buscarCitasPorStaff(any(), any(), any(), any())).thenReturn(List.of());

        citaService.listarPorStaff(ID_STAFF, FECHA, hasta, EstadoCita.CONFIRMADA);

        verify(citaRepository).buscarCitasPorStaff(
                ID_STAFF,
                at(FECHA, 0, 0),
                at(hasta.plusDays(1), 0, 0),
                EstadoCita.CONFIRMADA
        );
    }

    @Test
    void listarPorStaffMantieneSobrecargaSinFiltros() {
        List<Cita> citas = List.of(cita(at(9, 0), at(10, 0), at(10, 30)));
        when(citaRepository.findByIdStaff(ID_STAFF)).thenReturn(citas);

        assertThat(citaService.listarPorStaff(ID_STAFF)).isSameAs(citas);
        verify(citaRepository).findByIdStaff(ID_STAFF);
    }

    @Test
    void listarRechazaRangoInvertidoSoloCuandoAmbosLimitesExisten() {
        assertThatThrownBy(() -> citaService.listarPorCliente(
                ID_CLIENTE,
                FECHA,
                FECHA.minusDays(1),
                null
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("hasta no puede ser anterior");
    }

    private PerfilResumen perfil(UUID id, String nombre, String apellidos, String email) {
        return new PerfilResumen(id, "auth-" + id, "1-9", nombre, apellidos, email, null, true, null);
    }

    private JornadaStaff jornada(LocalTime inicio, LocalTime fin) {
        return jornada(FECHA, inicio, fin);
    }

    private JornadaStaff jornada(LocalDate fecha, LocalTime inicio, LocalTime fin) {
        return JornadaStaff.builder()
                .idStaff(ID_STAFF)
                .diaSemana(fecha.getDayOfWeek().getValue())
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
        return cita(ID_CLIENTE, ID_STAFF, inicio, finAtencion, finVisible, 60, 30);
    }

    private Cita cita(
            UUID idCliente,
            UUID idStaff,
            OffsetDateTime inicio,
            OffsetDateTime finAtencion,
            OffsetDateTime finVisible,
            int duracion,
            int holgura
    ) {
        return Cita.builder()
                .idCliente(idCliente)
                .idStaff(idStaff)
                .idServicio(ID_SERVICIO)
                .fechaHoraInicio(inicio)
                .fechaHoraFin(finVisible)
                .fechaHoraFinAtencion(finAtencion)
                .duracionServicioMin(duracion)
                .holguraMin(holgura)
                .estadoCita(EstadoCita.PENDIENTE_PAGO)
                .tipoCita(TipoCita.NORMAL)
                .build();
    }

    private OffsetDateTime at(int hour, int minute) {
        return FECHA.atTime(hour, minute).atZone(ZONE).toOffsetDateTime();
    }

    private OffsetDateTime at(LocalDate fecha, int hour, int minute) {
        return fecha.atTime(hour, minute).atZone(ZONE).toOffsetDateTime();
    }
}
