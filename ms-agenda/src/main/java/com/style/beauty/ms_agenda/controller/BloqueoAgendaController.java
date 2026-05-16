package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.entity.BloqueoAgenda;
import com.style.beauty.ms_agenda.repository.BloqueoAgendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agenda/bloqueos")
@RequiredArgsConstructor
public class BloqueoAgendaController {

    private final BloqueoAgendaRepository bloqueoAgendaRepository;

    @PostMapping
    public BloqueoAgenda crear(@RequestBody BloqueoAgenda bloqueoAgenda) {
        return bloqueoAgendaRepository.save(bloqueoAgenda);
    }

    @GetMapping("/staff/{idStaff}")
    public List<BloqueoAgenda> listarPorStaff(@PathVariable UUID idStaff) {
        return bloqueoAgendaRepository.findByIdStaff(idStaff);
    }
}