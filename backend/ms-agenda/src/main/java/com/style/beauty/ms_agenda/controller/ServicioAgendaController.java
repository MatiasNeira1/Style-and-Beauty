package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.dto.DisponibilidadMensualResponse;
import com.style.beauty.ms_agenda.dto.StaffServicioDetalleResponse;
import com.style.beauty.ms_agenda.service.CitaService;
import com.style.beauty.ms_agenda.service.StaffServicioAgendaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agenda/servicios")
@RequiredArgsConstructor
public class ServicioAgendaController {

    private final StaffServicioAgendaService staffServicioAgendaService;
    private final CitaService citaService;

    @GetMapping("/{idServicio}/staff")
    public List<StaffServicioDetalleResponse> listarStaffPorServicio(@PathVariable UUID idServicio) {
        return staffServicioAgendaService.listarStaffPorServicio(idServicio);
    }

    @GetMapping("/{idServicio}/staff/{idStaff}/disponibilidad-mensual")
    public List<DisponibilidadMensualResponse> disponibilidadMensual(
            @PathVariable UUID idServicio,
            @PathVariable UUID idStaff,
            @RequestParam int anio,
            @RequestParam int mes
    ) {
        return citaService.calcularDisponibilidadMensual(idServicio, idStaff, anio, mes);
    }
}
