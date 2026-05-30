package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.CatalogoClient;
import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.entity.JornadaStaff;
import com.style.beauty.ms_agenda.repository.BloqueoAgendaRepository;
import com.style.beauty.ms_agenda.repository.CitaRepository;
import com.style.beauty.ms_agenda.repository.HistorialCitaRepository;
import com.style.beauty.ms_agenda.repository.JornadaStaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CitaServiceTest {

    private static final UUID ID_CLIENTE = UUID.fromString("2a76509e-8c05-489f-b38f-8d2f67925375");
    private static final UUID ID_STAFF = UUID.fromString("0299819d-926d-4098-a3a1-727961efb647");
    private static final UUID ID_SERVICIO = UUID.fromString("e81a1fdd-5ac1-4c35-922b-517aa23a6a81");

    @Mock
    private CitaRepository citaRepository;
    @Mock
    private JornadaStaffRepository jornadaStaffRepository;
    @Mock
    private BloqueoAgendaRepository bloqueoAgendaRepository;
    @Mock
    private HistorialCitaRepository historialCitaRepository;
    @Mock
    private PerfilClient perfilClient;
    @Mock
    private CatalogoClient catalogoClient;

    private CitaService citaService;

    @BeforeEach
    void setUp() {
        citaService = new CitaService(
                citaRepository,
                jornadaStaffRepository,
                bloqueoAgendaRepository,
                historialCitaRepository,
                perfilClient,
                catalogoClient);
        ReflectionTestUtils.setField(citaService, "agendaZone", "America/Santiago");
        ReflectionTestUtils.setField(citaService, "defaultHolguraMin", 20);
    }

    @Test
    void disponibilidadUsaDuracionYHolguraDelBackendAunqueElRequestVengaManipulado() {
        LocalDate fecha = LocalDate.now().with(TemporalAdjusters.next(java.time.DayOfWeek.MONDAY));
        JornadaStaff jornada = JornadaStaff.builder()
                .idStaff(ID_STAFF)
                .diaSemana(fecha.getDayOfWeek().getValue())
                .horaInicio(java.time.LocalTime.of(9, 0))
                .horaFin(java.time.LocalTime.of(18, 0))
                .activo(true)
                .build();

        when(perfilClient.obtenerStaff(ID_STAFF)).thenReturn(perfil(ID_STAFF));
        when(catalogoClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Tratamiento capilar", "Peluqueria", 20, 30));
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, fecha.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada));
        when(citaRepository.buscarCitasEnRango(eq(ID_STAFF), any(), any(), any())).thenReturn(List.of());
        when(bloqueoAgendaRepository.buscarBloqueosEnRango(eq(ID_STAFF), any(), any())).thenReturn(List.of());

        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(
                new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, fecha, 999, 0));

        assertThat(slots).isNotEmpty();
        assertThat(slots.getFirst().fin()).isEqualTo(slots.getFirst().inicio().plusMinutes(20));
        assertThat(slots.getFirst().finConHolgura()).isEqualTo(slots.getFirst().inicio().plusMinutes(50));
    }

    @Test
    void crearGuardaDuracionYHolguraCalculadasPorServicio() {
        OffsetDateTime inicio = OffsetDateTime.parse("2026-06-01T09:00:00-04:00");
        JornadaStaff jornada = JornadaStaff.builder()
                .idStaff(ID_STAFF)
                .diaSemana(inicio.getDayOfWeek().getValue())
                .horaInicio(java.time.LocalTime.of(9, 0))
                .horaFin(java.time.LocalTime.of(18, 0))
                .activo(true)
                .build();

        when(perfilClient.obtenerCliente(ID_CLIENTE)).thenReturn(perfil(ID_CLIENTE));
        when(perfilClient.obtenerStaff(ID_STAFF)).thenReturn(perfil(ID_STAFF));
        when(catalogoClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(ID_SERVICIO, "Tratamiento capilar", "Peluqueria", 20, 30));
        when(jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(ID_STAFF, inicio.getDayOfWeek().getValue()))
                .thenReturn(List.of(jornada));
        when(bloqueoAgendaRepository.buscarBloqueosEnRango(eq(ID_STAFF), any(), any())).thenReturn(List.of());
        when(citaRepository.buscarChoquesAgenda(eq(ID_STAFF), any(), any(), any())).thenReturn(List.of());
        when(citaRepository.save(any(Cita.class))).thenAnswer(invocation -> invocation.getArgument(0));

        citaService.crear(new CrearCitaRequest(ID_CLIENTE, ID_STAFF, ID_SERVICIO, inicio, 999, 0, null));

        ArgumentCaptor<Cita> captor = ArgumentCaptor.forClass(Cita.class);
        org.mockito.Mockito.verify(citaRepository).save(captor.capture());
        Cita guardada = captor.getValue();
        assertThat(guardada.getDuracionServicioMin()).isEqualTo(20);
        assertThat(guardada.getHolguraMin()).isEqualTo(30);
        assertThat(guardada.getFechaHoraFin()).isEqualTo(inicio.plusMinutes(20));
        assertThat(guardada.getFechaHoraFinHolgura()).isEqualTo(inicio.plusMinutes(50));
    }

    private PerfilResumen perfil(UUID id) {
        return new PerfilResumen(id, "auth", "11111111-1", "Test", "User", "test@example.com");
    }
}
