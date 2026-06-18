package com.style.beauty.ms_cliente.controller;

import com.style.beauty.ms_cliente.service.PerfilService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/clientes/auth/{idAuth}")
    public ResponseEntity<?> obtenerClientePorAuthId(@PathVariable String idAuth) {
        try {
            return ResponseEntity.ok(perfilService.obtenerClientePorAuthId(idAuth));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/clientes/{idCliente}/puntos-fidelidad")
    public ResponseEntity<?> acumularPuntosFidelidad(
            @PathVariable UUID idCliente,
            @RequestParam(defaultValue = "1") int puntos
    ) {
        try {
            return ResponseEntity.ok(perfilService.acumularPuntosFidelidad(idCliente, puntos));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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
