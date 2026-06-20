package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.dto.CalendarConfigRequest;
import com.style.beauty.ms_agenda.dto.CitaAgendaResponse;
import com.style.beauty.ms_agenda.entity.StaffCalendarConfig;
import com.style.beauty.ms_agenda.enums.EstadoCita;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
import com.style.beauty.ms_agenda.service.CitaService;
import com.style.beauty.ms_agenda.service.StaffCalendarConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agenda/staff")
@RequiredArgsConstructor
public class StaffAgendaController {

    private final StaffCalendarConfigService calendarConfigService;
    private final CitaService citaService;

    @GetMapping("/{idStaff}/calendar-config")
    public StaffCalendarConfig obtenerCalendarConfig(@PathVariable UUID idStaff) {
        return calendarConfigService.buscarPorStaff(idStaff)
                .orElseThrow(() -> new ResourceNotFoundException("Configuracion de calendario no encontrada para el staff"));
    }

    @PostMapping("/{idStaff}/calendar-config")
    public StaffCalendarConfig crearCalendarConfig(
            @PathVariable UUID idStaff,
            @Valid @RequestBody CalendarConfigRequest request) {
        return calendarConfigService.guardar(idStaff, request);
    }

    @PutMapping("/{idStaff}/calendar-config")
    public StaffCalendarConfig actualizarCalendarConfig(
            @PathVariable UUID idStaff,
            @Valid @RequestBody CalendarConfigRequest request) {
        return calendarConfigService.actualizar(idStaff, request);
    }

    @GetMapping("/{idStaff}/citas")
    public List<CitaAgendaResponse> listarCitasPorStaff(
            @PathVariable UUID idStaff,
            @RequestParam(required = false) LocalDate desde,
            @RequestParam(required = false) LocalDate hasta,
            @RequestParam(required = false) EstadoCita estado) {
        return citaService.listarPorStaff(idStaff, desde, hasta, estado);
    }
}
