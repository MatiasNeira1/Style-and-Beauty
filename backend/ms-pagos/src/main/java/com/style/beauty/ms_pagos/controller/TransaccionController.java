package com.style.beauty.ms_pagos.controller;

import com.style.beauty.ms_pagos.dto.ConfirmarPagoRequest;
import com.style.beauty.ms_pagos.dto.CrearTransaccionRequest;
import com.style.beauty.ms_pagos.entity.Transaccion;
import com.style.beauty.ms_pagos.service.TransaccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pagos/transacciones")
@RequiredArgsConstructor
public class TransaccionController {

    private final TransaccionService transaccionService;

    @GetMapping
    public List<Transaccion> listar() {
        return transaccionService.listar();
    }

    @GetMapping("/{id}")
    public Transaccion buscarPorId(@PathVariable UUID id) {
        return transaccionService.buscarPorId(id);
    }

    @PostMapping
    public Transaccion iniciar(@Valid @RequestBody CrearTransaccionRequest request) {
        return transaccionService.iniciar(request);
    }

    @PatchMapping("/{id}/confirmar")
    public Transaccion confirmar(
            @PathVariable UUID id,
            @Valid @RequestBody ConfirmarPagoRequest request) {
        return transaccionService.confirmar(id, request);
    }

    @PatchMapping("/{id}/rechazar")
    public Transaccion rechazar(@PathVariable UUID id) {
        return transaccionService.rechazar(id);
    }

    @PatchMapping("/{id}/expirar")
    public Transaccion expirar(@PathVariable UUID id) {
        return transaccionService.expirar(id);
    }
}