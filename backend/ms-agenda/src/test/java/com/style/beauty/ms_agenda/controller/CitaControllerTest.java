package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.service.CitaService;
import com.style.beauty.ms_agenda.service.FirebaseTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CitaControllerTest {

    private static final UUID ID_CLIENTE = UUID.fromString("10000000-0000-4000-8000-000000000001");

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
}
