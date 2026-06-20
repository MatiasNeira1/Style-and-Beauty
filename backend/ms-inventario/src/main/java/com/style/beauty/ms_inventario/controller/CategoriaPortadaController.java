package com.style.beauty.ms_inventario.controller;

import com.style.beauty.ms_inventario.dto.CategoriaPortadaResponse;
import com.style.beauty.ms_inventario.service.CategoriaPortadaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventarios/categorias")
@RequiredArgsConstructor
public class CategoriaPortadaController {
    private final CategoriaPortadaService categoriaPortadaService;

    @GetMapping("/portadas")
    public List<CategoriaPortadaResponse> listarPortadas() {
        return categoriaPortadaService.listarPortadas();
    }

    @PostMapping(value = "/{categoria}/portada", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CategoriaPortadaResponse actualizarPortada(
            @PathVariable String categoria,
            @RequestParam("file") MultipartFile file) {
        return categoriaPortadaService.actualizarPortada(categoria, file);
    }
}
