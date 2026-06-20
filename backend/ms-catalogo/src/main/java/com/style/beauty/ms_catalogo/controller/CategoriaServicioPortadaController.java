package com.style.beauty.ms_catalogo.controller;

import com.style.beauty.ms_catalogo.dto.CategoriaServicioPortadaResponse;
import com.style.beauty.ms_catalogo.service.CategoriaServicioPortadaService;
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
@RequestMapping("/api/categorias")
public class CategoriaServicioPortadaController {
    private final CategoriaServicioPortadaService service;

    public CategoriaServicioPortadaController(CategoriaServicioPortadaService service) {
        this.service = service;
    }

    @GetMapping("/portadas")
    public List<CategoriaServicioPortadaResponse> listarPortadas() {
        return service.listarPortadas();
    }

    @PostMapping(value = "/{categoria}/portada", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CategoriaServicioPortadaResponse actualizarPortada(
            @PathVariable String categoria,
            @RequestParam("file") MultipartFile file) {
        return service.actualizarPortada(categoria, file);
    }
}
