package com.style.beauty.ms_notificacion_audit.controller;

import com.style.beauty.ms_notificacion_audit.document.Alerta;
import com.style.beauty.ms_notificacion_audit.service.NotificacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notificacion")
public class NotificacionController {

    @Autowired
    private NotificacionService service;

    // POST /api/notificacion — Crear una nueva notificación
    @PostMapping
    public ResponseEntity<Alerta> crear(@RequestBody Alerta alerta) {
        return ResponseEntity.ok(service.crear(alerta));
    }

    // GET /api/notificacion — Listar todas las notificaciones
    @GetMapping
    public List<Alerta> listarTodas() {
        return service.listarTodas();
    }

    // GET /api/notificacion/usuario/{id} — Notificaciones de un usuario
    @GetMapping("/usuario/{id}")
    public List<Alerta> buscarPorUsuario(@PathVariable String id) {
        return service.buscarPorUsuario(id);
    }

    // GET /api/notificacion/pendientes — Notificaciones no enviadas
    @GetMapping("/pendientes")
    public List<Alerta> buscarPendientes() {
        return service.buscarPendientes();
    }

    // PUT /api/notificacion/{id}/enviar — Marcar como enviada
    @PutMapping("/{id}/enviar")
    public ResponseEntity<Alerta> marcarEnviada(@PathVariable String id) {
        return ResponseEntity.ok(service.marcarComoEnviada(id));
    }
}
