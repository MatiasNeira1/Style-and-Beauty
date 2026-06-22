package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.CrearCitasLoteRequest;
import com.style.beauty.ms_agenda.dto.CrearCitasLoteResponse;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.enums.EstadoCita;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.service.CitaService;
import com.style.beauty.ms_agenda.service.FirebaseTokenVerifier;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CitaControllerTest {

    private static final UUID ID_CLIENTE = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID ID_STAFF = UUID.fromString("20000000-0000-4000-8000-000000000001");

    private MockMvc mockMvc;
    private CitaService citaService;
    private PerfilClient perfilClient;
    private FirebaseTokenVerifier firebaseTokenVerifier;

    @BeforeEach
    void setUp() {
        citaService = mock(CitaService.class);
        perfilClient = mock(PerfilClient.class);
        firebaseTokenVerifier = mock(FirebaseTokenVerifier.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new CitaController(citaService, perfilClient, firebaseTokenVerifier))
                .build();
    }

    @Test
    void getDisponibilidadUsaEndpointLiteralNoRutaPorId() throws Exception {
        when(citaService.calcularDisponibilidad(any(DisponibilidadRequest.class))).thenReturn(List.of());

        mockMvc.perform(get("/api/agenda/citas/disponibilidad")
                        .param("idStaff", "20000000-0000-4000-8000-000000000001")
                        .param("idServicio", "30000000-0000-4000-8000-000000000001")
                        .param("fecha", "2030-01-07"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void getDisponibilidadIncompletaFallaPorParametroFaltanteNoPorUuid() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/agenda/citas/disponibilidad"))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertThat(result.getResolvedException())
                .isInstanceOf(MissingServletRequestParameterException.class);
    }

    @Test
    void getMisProximasUsaClienteAutenticado() throws Exception {
        when(firebaseTokenVerifier.authenticatedClientUid("Bearer token")).thenReturn("firebase-uid");
        when(perfilClient.obtenerClientePorAuthId("firebase-uid"))
                .thenReturn(new PerfilResumen(ID_CLIENTE, "firebase-uid", "1-9", "Cliente", "Demo", "cliente@example.com", null, true, null));
        when(citaService.listarProximasCliente(ID_CLIENTE)).thenReturn(List.of());

        mockMvc.perform(get("/api/agenda/citas/mis-proximas")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        verify(citaService).listarProximasCliente(ID_CLIENTE);
    }

    @Test
    void getMisCitasUsaStaffAutenticado() throws Exception {
        when(firebaseTokenVerifier.authenticatedUid("Bearer token")).thenReturn("firebase-staff-uid");
        when(perfilClient.obtenerStaffPorAuthId("firebase-staff-uid"))
                .thenReturn(new PerfilResumen(ID_STAFF, "firebase-staff-uid", "2-7", "Martina", "Salas", "martina.salas@stylebeauty.cl", null, true, null));
        when(citaService.listarAgendaStaff(ID_STAFF)).thenReturn(List.of());

        mockMvc.perform(get("/api/agenda/citas/mis-citas")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        verify(citaService).listarAgendaStaff(ID_STAFF);
    }

    @Test
    void finalizarMiCitaUsaStaffAutenticado() throws Exception {
        UUID idCita = UUID.fromString("30000000-0000-4000-8000-000000000001");
        Cita finalizada = Cita.builder()
                .idCita(idCita)
                .idStaff(ID_STAFF)
                .estadoCita(EstadoCita.FINALIZADA)
                .build();

        when(firebaseTokenVerifier.authenticatedUid("Bearer token")).thenReturn("firebase-staff-uid");
        when(perfilClient.obtenerStaffPorAuthId("firebase-staff-uid"))
                .thenReturn(new PerfilResumen(ID_STAFF, "firebase-staff-uid", "2-7", "Martina", "Salas", "martina.salas@stylebeauty.cl", null, true, null));
        when(citaService.finalizarCitaStaff(idCita, ID_STAFF)).thenReturn(finalizada);

        mockMvc.perform(patch("/api/agenda/citas/mis-citas/{id}/finalizar", idCita)
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk());

        verify(citaService).finalizarCitaStaff(idCita, ID_STAFF);
    }

    @Test
    void postCrearDesdeAdminUsaClienteDelPayloadYExigeAdmin() throws Exception {
        UUID idCita = UUID.fromString("30000000-0000-4000-8000-000000000001");
        UUID idServicio = UUID.fromString("40000000-0000-4000-8000-000000000001");
        Cita creada = Cita.builder()
                .idCita(idCita)
                .idCliente(ID_CLIENTE)
                .idStaff(ID_STAFF)
                .idServicio(idServicio)
                .estadoCita(EstadoCita.CONFIRMADA)
                .build();
        when(citaService.crearDesdeAdmin(any(CrearCitaRequest.class))).thenReturn(creada);

        mockMvc.perform(post("/api/agenda/citas/admin")
                        .header("Authorization", "Bearer admin-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "idCliente": "10000000-0000-4000-8000-000000000001",
                                  "idStaff": "20000000-0000-4000-8000-000000000001",
                                  "idServicio": "40000000-0000-4000-8000-000000000001",
                                  "fechaHoraInicio": "2030-01-07T09:30:00-03:00",
                                  "abono": 10000
                                }
                                """))
                .andExpect(status().isOk());

        verify(firebaseTokenVerifier).authenticatedAdminUid("Bearer admin-token");
        ArgumentCaptor<CrearCitaRequest> captor = ArgumentCaptor.forClass(CrearCitaRequest.class);
        verify(citaService).crearDesdeAdmin(captor.capture());
        assertThat(captor.getValue().idCliente()).isEqualTo(ID_CLIENTE);
        assertThat(captor.getValue().abono()).isEqualByComparingTo("10000");
    }

    @Test
    void postCrearLoteDesdeAdminExigeAdminYPropagaPayload() throws Exception {
        when(citaService.crearLoteDesdeAdmin(any(CrearCitasLoteRequest.class)))
                .thenReturn(new CrearCitasLoteResponse(ID_CLIENTE, LocalDate.of(2030, 1, 7), 2, 180, List.of()));

        mockMvc.perform(post("/api/agenda/citas/lote")
                        .header("Authorization", "Bearer admin-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "idCliente": "10000000-0000-4000-8000-000000000001",
                                  "fecha": "2030-01-07",
                                  "abono": 20000,
                                  "reservas": [
                                    {
                                      "idServicio": "40000000-0000-4000-8000-000000000001",
                                      "idStaff": "20000000-0000-4000-8000-000000000001",
                                      "horaInicio": "08:00",
                                      "notaInterna": "Primera"
                                    },
                                    {
                                      "idServicio": "40000000-0000-4000-8000-000000000002",
                                      "idStaff": "20000000-0000-4000-8000-000000000001",
                                      "horaInicio": "10:00",
                                      "notaInterna": "Segunda"
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        verify(firebaseTokenVerifier).authenticatedAdminUid("Bearer admin-token");
        ArgumentCaptor<CrearCitasLoteRequest> captor = ArgumentCaptor.forClass(CrearCitasLoteRequest.class);
        verify(citaService).crearLoteDesdeAdmin(captor.capture());
        assertThat(captor.getValue().idCliente()).isEqualTo(ID_CLIENTE);
        assertThat(captor.getValue().fecha()).isEqualTo(LocalDate.of(2030, 1, 7));
        assertThat(captor.getValue().abono()).isEqualByComparingTo("20000");
        assertThat(captor.getValue().reservas()).hasSize(2);
        assertThat(captor.getValue().reservas().get(0).horaInicio()).isEqualTo(LocalTime.of(8, 0));
    }
}
