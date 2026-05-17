package com.style.beauty.ms_notificacion_audit.controller;

import com.style.beauty.ms_notificacion_audit.document.RegistroAuditoria;
import com.style.beauty.ms_notificacion_audit.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
public class AuditoriaController {

    @Autowired
    private AuditoriaService service;

    // POST /api/audit — Registrar un nuevo log de auditoría
    @PostMapping
    public ResponseEntity<RegistroAuditoria> registrar(@RequestBody RegistroAuditoria registro) {
        return ResponseEntity.ok(service.registrar(registro));
    }

    // GET /api/audit — Listar todos los registros
    @GetMapping
    public List<RegistroAuditoria> listarTodos() {
        return service.listarTodos();
    }

    // GET /api/audit/usuario/{id} — Filtrar logs por usuario
    @GetMapping("/usuario/{id}")
    public List<RegistroAuditoria> buscarPorUsuario(@PathVariable String id) {
        return service.buscarPorUsuario(id);
    }

    // GET /api/audit/entidad/{nombre} — Filtrar logs por entidad
    @GetMapping("/entidad/{nombre}")
    public List<RegistroAuditoria> buscarPorEntidad(@PathVariable String nombre) {
        return service.buscarPorEntidad(nombre);
    }

    // GET /api/audit/accion/{accion} — Filtrar logs por tipo de acción
    @GetMapping("/accion/{accion}")
    public List<RegistroAuditoria> buscarPorAccion(@PathVariable String accion) {
        return service.buscarPorAccion(accion);
    }
}
