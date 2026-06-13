package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadMensualResponse;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSemanalRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.service.CitaService;
import com.style.beauty.ms_agenda.service.FirebaseTokenVerifier;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agenda/citas")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService citaService;
    private final PerfilClient perfilClient;
    private final FirebaseTokenVerifier firebaseTokenVerifier;

    @GetMapping
    public List<Cita> listar() {
        return citaService.listar();
    }

    @GetMapping("/{id}")
    public Cita buscarPorId(@PathVariable UUID id) {
        return citaService.buscarPorId(id);
    }

    @PostMapping("/disponibilidad")
    public List<DisponibilidadSlot> disponibilidad(@Valid @RequestBody DisponibilidadRequest request) {
        return citaService.calcularDisponibilidad(request);
    }

    @PostMapping("/disponibilidad-semanal")
    public List<DisponibilidadMensualResponse> disponibilidadSemanal(@Valid @RequestBody DisponibilidadSemanalRequest request) {
        return citaService.calcularDisponibilidadSemanal(request);
    }

    @PostMapping
    public Cita crear(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CrearCitaRequest request) {
        String uid = firebaseTokenVerifier.authenticatedClientUid(authHeader);
        PerfilResumen cliente = perfilClient.obtenerClientePorAuthId(uid);
        return citaService.crear(request.withCliente(cliente.idPersona()));
    }

    @PatchMapping("/{id}/estado")
    public Cita actualizarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody ActualizarEstadoCitaRequest request) {
        return citaService.actualizarEstado(id, request);
    }

    @DeleteMapping("/{id}")
    public void cancelar(@PathVariable UUID id) {
        citaService.cancelar(id);
    }
}
