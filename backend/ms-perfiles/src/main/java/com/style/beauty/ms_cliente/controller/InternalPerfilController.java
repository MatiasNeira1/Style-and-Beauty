package com.style.beauty.ms_cliente.controller;

import com.style.beauty.ms_cliente.service.PerfilService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/internal/perfiles")
public class InternalPerfilController {

    @Autowired
    private PerfilService perfilService;

    @GetMapping("/clientes/{idCliente}")
    public ResponseEntity<?> obtenerCliente(@PathVariable UUID idCliente) {
        try {
            return ResponseEntity.ok(perfilService.obtenerClientePorId(idCliente));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/staff/{idStaff}")
    public ResponseEntity<?> obtenerStaff(@PathVariable UUID idStaff) {
        try {
            return ResponseEntity.ok(perfilService.obtenerStaffPorId(idStaff));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
