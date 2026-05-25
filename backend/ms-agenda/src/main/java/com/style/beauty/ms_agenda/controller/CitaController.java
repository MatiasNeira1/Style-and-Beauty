package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.service.CitaService;
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
    public Cita crear(@Valid @RequestBody CrearCitaRequest request) {
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
}
