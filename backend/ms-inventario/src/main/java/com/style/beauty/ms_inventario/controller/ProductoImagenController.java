package com.style.beauty.ms_inventario.controller;

import com.style.beauty.ms_inventario.entity.Producto;
import com.style.beauty.ms_inventario.service.InventarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoImagenController {
    private final InventarioService inventarioService;

    @PostMapping("/{id}/imagen")
    public Producto subirImagen(@PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        return inventarioService.actualizarImagenProducto(id, file);
    }

    @DeleteMapping("/{id}/imagen")
    public Producto eliminarImagen(@PathVariable UUID id) {
        return inventarioService.eliminarImagenProducto(id);
    }
}
