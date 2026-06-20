package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.dto.CategoriaServicioPortadaResponse;
import com.style.beauty.ms_catalogo.entity.CategoriaServicioPortada;
import com.style.beauty.ms_catalogo.repository.CategoriaServicioPortadaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class CategoriaServicioPortadaService {
    private final CategoriaServicioPortadaRepository repository;
    private final AzureBlobStorageService azureBlobStorageService;

    public CategoriaServicioPortadaService(
            CategoriaServicioPortadaRepository repository,
            AzureBlobStorageService azureBlobStorageService) {
        this.repository = repository;
        this.azureBlobStorageService = azureBlobStorageService;
    }

    @Transactional(readOnly = true)
    public List<CategoriaServicioPortadaResponse> listarPortadas() {
        return repository.findAll().stream()
                .map(portada -> new CategoriaServicioPortadaResponse(portada.getCategoria(), portada.getImagenUrl()))
                .toList();
    }

    @Transactional
    public CategoriaServicioPortadaResponse actualizarPortada(String categoria, MultipartFile file) {
        String categoriaNormalizada = validarCategoria(categoria);
        CategoriaServicioPortada portada = repository.findByCategoriaIgnoreCase(categoriaNormalizada)
                .orElseGet(() -> {
                    CategoriaServicioPortada nueva = new CategoriaServicioPortada();
                    nueva.setCategoria(categoriaNormalizada);
                    return nueva;
                });
        String folder = "categorias-servicios/" + slug(categoriaNormalizada);
        String imagenUrl = portada.getImagenUrl() == null || portada.getImagenUrl().isBlank()
                ? azureBlobStorageService.upload(file, folder)
                : azureBlobStorageService.replace(portada.getImagenUrl(), file, folder);

        portada.setImagenUrl(imagenUrl);
        CategoriaServicioPortada guardada = repository.save(portada);
        return new CategoriaServicioPortadaResponse(guardada.getCategoria(), guardada.getImagenUrl());
    }

    private String validarCategoria(String categoria) {
        String value = categoria == null ? "" : categoria.trim().replaceAll("\\s+", " ");
        if (value.length() < 2 || value.length() > 100) {
            throw new IllegalArgumentException("La categoria del servicio no es valida.");
        }
        return value;
    }

    private String slug(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}
