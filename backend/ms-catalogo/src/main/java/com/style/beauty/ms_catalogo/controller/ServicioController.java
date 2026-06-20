package com.style.beauty.ms_catalogo.controller;

import com.style.beauty.ms_catalogo.entity.Servicio;
import com.style.beauty.ms_catalogo.service.ServicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/servicio", "/api/servicios"})
public class ServicioController {

    @Autowired
    private ServicioService service;

    // GET /api/servicio — Listar todos los servicios activos
    @GetMapping
    public List<Servicio> listar() {
        return service.listarTodos();
    }

    @GetMapping("/admin/todos")
    public List<Servicio> listarTodosAdmin() {
        return service.listarTodosIncluyendoInactivos();
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
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Servicio> crear(@RequestBody Servicio servicio) {
        return ResponseEntity.ok(service.guardar(servicio));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Servicio> crearConImagen(
            @RequestParam String nombre,
            @RequestParam(required = false) String descripcion,
            @RequestParam(required = false) String detallerservicio,
            @RequestParam String categoria,
            @RequestParam(required = false) String manual_uso_url,
            @RequestParam Integer duracion_minutos,
            @RequestParam(required = false) Integer holgura_minutos,
            @RequestParam Double precio_total,
            @RequestParam(required = false, defaultValue = "15000") Double monto_fianza,
            @RequestParam(defaultValue = "true") Boolean activo,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(service.guardarConImagen(
                nombre,
                descripcion,
                detallerservicio,
                categoria,
                manual_uso_url,
                duracion_minutos,
                holgura_minutos,
                precio_total,
                monto_fianza,
                activo,
                file));
    }

    // PUT /api/servicio/{id} — Actualizar un servicio existente
    @PutMapping("/{id}")
    public ResponseEntity<Servicio> actualizar(@PathVariable UUID id, @RequestBody Servicio servicio) {
        return service.actualizar(id, servicio)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/servicios/{id}/imagen — Subir o reemplazar imagen del servicio
    @PostMapping("/{id}/imagen")
    public ResponseEntity<Servicio> subirImagen(@PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        return service.actualizarImagen(id, file)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/servicios/{id}/imagen — Eliminar imagen del servicio
    @DeleteMapping("/{id}/imagen")
    public ResponseEntity<Servicio> eliminarImagen(@PathVariable UUID id) {
        return service.eliminarImagen(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<Servicio> activar(@PathVariable UUID id) {
        return service.cambiarEstado(id, true)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<Servicio> desactivar(@PathVariable UUID id) {
        return service.cambiarEstado(id, false)
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
