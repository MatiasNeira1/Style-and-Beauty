package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.dto.CitaAgendaResponse;
import com.style.beauty.ms_agenda.enums.EstadoCita;
import com.style.beauty.ms_agenda.service.CitaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agenda/clientes")
@RequiredArgsConstructor
public class ClienteAgendaController {

    private final CitaService citaService;

    @GetMapping("/{idCliente}/citas")
    public List<CitaAgendaResponse> listarCitasPorCliente(
            @PathVariable UUID idCliente,
            @RequestParam(required = false) LocalDate desde,
            @RequestParam(required = false) LocalDate hasta,
            @RequestParam(required = false) EstadoCita estado) {
        return citaService.listarPorCliente(idCliente, desde, hasta, estado);
    }
}
