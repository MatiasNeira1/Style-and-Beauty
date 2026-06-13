package com.style.beauty.ms_agenda.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CancelarCitaRequest;
import com.style.beauty.ms_agenda.dto.CitaAgendaResponse;
import com.style.beauty.ms_agenda.dto.ConfirmarPagoRequest;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadMensualResponse;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSemanalRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.dto.FinalizarCitaRequest;
import com.style.beauty.ms_agenda.dto.RechazarPagoRequest;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.enums.EstadoCita;
import com.style.beauty.ms_agenda.service.CitaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agenda/citas")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService citaService;
    private final PerfilClient perfilClient;

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
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String uid = authenticatedUid(authHeader);
            PerfilResumen cliente = perfilClient.obtenerClientePorAuthId(uid);
            return citaService.crear(request.withCliente(cliente.idPersona()));
        }

        return citaService.crear(request);
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

    @PatchMapping("/{id}/confirmar-pago")
    public Cita confirmarPago(
            @PathVariable UUID id,
            @RequestBody(required = false) ConfirmarPagoRequest request) {
        return citaService.confirmarPago(id, request == null ? new ConfirmarPagoRequest(null) : request);
    }

    @PatchMapping("/{id}/rechazar-pago")
    public Cita rechazarPago(
            @PathVariable UUID id,
            @RequestBody(required = false) RechazarPagoRequest request) {
        return citaService.rechazarPago(id, request == null ? new RechazarPagoRequest(null) : request);
    }

    @PatchMapping("/{id}/cancelar")
    public Cita cancelarConMotivo(
            @PathVariable UUID id,
            @RequestBody(required = false) CancelarCitaRequest request) {
        return citaService.cancelar(id, request == null ? new CancelarCitaRequest(null) : request);
    }

    @PatchMapping("/{id}/finalizar")
    public Cita finalizar(
            @PathVariable UUID id,
            @RequestBody(required = false) FinalizarCitaRequest request) {
        return citaService.finalizar(id, request == null ? new FinalizarCitaRequest(null) : request);
    }

    @GetMapping("/staff/{idStaff}")
    public List<CitaAgendaResponse> listarPorStaff(
            @PathVariable UUID idStaff,
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta,
            @RequestParam(required = false) EstadoCita estado) {
        return citaService.listarPorStaff(idStaff, desde, hasta, estado);
    }

    @GetMapping("/clientes/{idCliente}")
    public List<CitaAgendaResponse> listarPorCliente(
            @PathVariable UUID idCliente,
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta,
            @RequestParam(required = false) EstadoCita estado) {
        return citaService.listarPorCliente(idCliente, desde, hasta, estado);
    }

    private String authenticatedUid(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Falta el header Authorization.");
        }

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(authHeader.substring(7));
            return decodedToken.getUid();
        } catch (FirebaseAuthException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token inválido o expirado.");
        }
    }
}
