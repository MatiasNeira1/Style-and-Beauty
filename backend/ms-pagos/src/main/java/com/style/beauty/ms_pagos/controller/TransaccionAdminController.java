package com.style.beauty.ms_pagos.controller;

import com.style.beauty.ms_pagos.dto.TransaccionPagoAdminResponse;
import com.style.beauty.ms_pagos.service.TransaccionAdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
public class TransaccionAdminController {

    private final TransaccionAdminService transaccionAdminService;

    public TransaccionAdminController(TransaccionAdminService transaccionAdminService) {
        this.transaccionAdminService = transaccionAdminService;
    }

    @GetMapping("/transacciones")
    public List<TransaccionPagoAdminResponse> listarTransacciones() {
        return transaccionAdminService.listarTransacciones();
    }
}
