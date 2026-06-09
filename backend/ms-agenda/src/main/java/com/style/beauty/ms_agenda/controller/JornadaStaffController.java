package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.dto.CrearJornadaStaffRequest;
import com.style.beauty.ms_agenda.entity.JornadaStaff;
import com.style.beauty.ms_agenda.service.JornadaStaffService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/api/agenda/jornadas")
@RequiredArgsConstructor
public class JornadaStaffController {
 private final JornadaStaffService jornadaStaffService;

    @PostMapping
    public JornadaStaff crear(@Valid @RequestBody CrearJornadaStaffRequest request) {
        return jornadaStaffService.crear(request);
    }

    @GetMapping("/staff/{idStaff}")
    public List<JornadaStaff> listarPorStaff(@PathVariable UUID idStaff) {
        return jornadaStaffService.listarPorStaff(idStaff);
    }

    @GetMapping("/staff/{idStaff}/dia/{diaSemana}")
    public List<JornadaStaff> listarPorStaffYDia(
            @PathVariable UUID idStaff,
            @PathVariable Integer diaSemana
    ) {
        return jornadaStaffService.listarPorStaffYDia(idStaff, diaSemana);
    }
}
