package com.style.beauty.ms_agenda.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.service.CitaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    public Cita crear(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CrearCitaRequest request) {
        String uid = authenticatedUid(authHeader);
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
