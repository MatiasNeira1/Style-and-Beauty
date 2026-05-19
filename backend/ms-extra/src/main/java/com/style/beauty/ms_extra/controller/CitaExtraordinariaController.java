package com.style.beauty.ms_extra.controller;

import com.style.beauty.ms_extra.dto.ChatRequest;
import com.style.beauty.ms_extra.dto.CrearCitaExtraordinariaRequest;
import com.style.beauty.ms_extra.dto.PropuestaStaffRequest;
import com.style.beauty.ms_extra.entity.ChatExtraordinario;
import com.style.beauty.ms_extra.entity.CitaExtraordinaria;
import com.style.beauty.ms_extra.service.CitaExtraordinariaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/extra/citas")
@RequiredArgsConstructor
public class CitaExtraordinariaController {

    private final CitaExtraordinariaService service;

    @GetMapping
    public List<CitaExtraordinaria> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public CitaExtraordinaria buscarPorId(@PathVariable UUID id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public CitaExtraordinaria solicitar(@Valid @RequestBody CrearCitaExtraordinariaRequest request) {
        return service.solicitar(request);
    }

    @PatchMapping("/{id}/propuesta-staff")
    public CitaExtraordinaria proponerHorario(
            @PathVariable UUID id,
            @Valid @RequestBody PropuestaStaffRequest request) {
        return service.proponerHorario(id, request);
    }

    @PatchMapping("/{id}/aceptar-cliente")
    public CitaExtraordinaria aceptarCliente(@PathVariable UUID id) {
        return service.aceptarCliente(id);
    }

    @PatchMapping("/{id}/rechazar-cliente")
    public CitaExtraordinaria rechazarCliente(@PathVariable UUID id) {
        return service.rechazarCliente(id);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable UUID id) {
        service.eliminar(id);
    }

    @PatchMapping("/{id}/confirmar-pago/{idCitaGenerada}")
    public CitaExtraordinaria confirmarPago(
            @PathVariable UUID id,
            @PathVariable UUID idCitaGenerada) {
        return service.confirmarPago(id, idCitaGenerada);
    }

    @PostMapping("/{id}/chat")
    public ChatExtraordinario enviarMensaje(
            @PathVariable UUID id,
            @Valid @RequestBody ChatRequest request) {
        return service.enviarMensaje(id, request);
    }

    @GetMapping("/{id}/chat")
    public List<ChatExtraordinario> listarChat(@PathVariable UUID id) {
        return service.listarChat(id);
    }
}
