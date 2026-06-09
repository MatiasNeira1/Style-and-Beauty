package com.style.beauty.ms_catalogo.controller;

import com.style.beauty.ms_catalogo.entity.Servicio;
import com.style.beauty.ms_catalogo.service.ServicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/servicio")
public class ServicioController {

    @Autowired
    private ServicioService service;

    // GET /api/servicio — Listar todos los servicios activos
    @GetMapping
    public List<Servicio> listar() {
        return service.listarTodos();
    }

    // GET /api/servicio/{id} — Buscar servicio por ID
    @GetMapping("/{id}")
    public ResponseEntity<Servicio> buscarPorId(@PathVariable UUID id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    // GET /api/servicio/categoria/{categoria} — Filtrar por categoría
    @GetMapping("/categoria/{categoria}")
    public List<Servicio> listarPorCategoria(@PathVariable String categoria) {
        return service.listarPorCategoria(categoria);
    }

    // POST /api/servicio — Crear un nuevo servicio
    @PostMapping
    public ResponseEntity<Servicio> crear(@RequestBody Servicio servicio) {
        return ResponseEntity.ok(service.guardar(servicio));
    }

    // PUT /api/servicio/{id} — Actualizar un servicio existente
    @PutMapping("/{id}")
    public ResponseEntity<Servicio> actualizar(@PathVariable UUID id, @RequestBody Servicio servicio) {
        return service.actualizar(id, servicio)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/servicio/{id} — Eliminar un servicio
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        return service.buscarPorId(id)
                .map(existente -> {
                    service.eliminar(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/servicio/{id}/profesionales
    @GetMapping("/{id}/profesionales")
    public List<Object> obtenerProfesionales(@PathVariable UUID id) {
        return service.obtenerProfesionalesPorServicio(id);
    }

    // GET /api/servicio/nombre/{nombre}/profesionales
    @GetMapping("/nombre/{nombre}/profesionales")
    public List<Object> obtenerProfesionalesPorNombre(@PathVariable String nombre) {
        return service.obtenerProfesionalesPorNombreServicio(nombre);
    }
}
