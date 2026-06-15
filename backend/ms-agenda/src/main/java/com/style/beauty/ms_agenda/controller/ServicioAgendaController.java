package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.dto.DisponibilidadMensualResponse;
import com.style.beauty.ms_agenda.dto.StaffServicioDetalleResponse;
import com.style.beauty.ms_agenda.service.CitaService;
import com.style.beauty.ms_agenda.service.StaffServicioAgendaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class ServicioAgendaController {

    private final StaffServicioAgendaService staffServicioAgendaService;
    private final CitaService citaService;

    @GetMapping("/{idServicio}/staff")
    public List<StaffServicioDetalleResponse> listarStaffPorServicio(@PathVariable UUID idServicio) {
        log.info("Entrando a endpoint GET /api/agenda/servicios/{idServicio}/staff: idServicio={}", idServicio);
        return staffServicioAgendaService.listarStaffPorServicio(idServicio);
    }

    @GetMapping("/{idServicio}/staff/{idStaff}/disponibilidad-mensual")
    public List<DisponibilidadMensualResponse> disponibilidadMensual(
            @PathVariable UUID idServicio,
            @PathVariable UUID idStaff,
            @RequestParam int anio,
            @RequestParam int mes
    ) {
        log.info("Entrando a endpoint GET /api/agenda/servicios/{idServicio}/staff/{idStaff}/disponibilidad-mensual: idServicio={}, idStaff={}, anio={}, mes={}",
                idServicio, idStaff, anio, mes);

        return citaService.calcularDisponibilidadMensual(idServicio, idStaff, anio, mes);
    }
}
