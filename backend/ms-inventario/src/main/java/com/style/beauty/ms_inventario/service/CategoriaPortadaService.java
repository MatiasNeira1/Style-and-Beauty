package com.style.beauty.ms_inventario.service;

import com.style.beauty.ms_inventario.dto.CategoriaPortadaResponse;
import com.style.beauty.ms_inventario.entity.CategoriaPortada;
import com.style.beauty.ms_inventario.exception.BusinessException;
import com.style.beauty.ms_inventario.repository.CategoriaPortadaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoriaPortadaService {
    private static final List<String> CATEGORIAS = List.of(
            "Cabello",
            "Nails",
            "Cuidados de la piel",
            "Spa",
            "Maquillaje"
    );

    private final CategoriaPortadaRepository categoriaPortadaRepository;
    private final AzureBlobStorageService azureBlobStorageService;

    @Transactional(readOnly = true)
    public List<CategoriaPortadaResponse> listarPortadas() {
        Map<String, CategoriaPortada> portadas = categoriaPortadaRepository.findAll().stream()
                .collect(Collectors.toMap(
                        portada -> portada.getCategoria().toLowerCase(Locale.ROOT),
                        Function.identity(),
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));

        return CATEGORIAS.stream()
                .map(categoria -> new CategoriaPortadaResponse(
                        categoria,
                        portadas.containsKey(categoria.toLowerCase(Locale.ROOT))
                                ? portadas.get(categoria.toLowerCase(Locale.ROOT)).getImagenUrl()
                                : null
                ))
                .toList();
    }

    @Transactional
    public CategoriaPortadaResponse actualizarPortada(String categoria, MultipartFile file) {
        String categoriaCanonica = categoriaCanonica(categoria);
        CategoriaPortada portada = categoriaPortadaRepository.findByCategoriaIgnoreCase(categoriaCanonica)
                .orElseGet(() -> CategoriaPortada.builder().categoria(categoriaCanonica).build());
        String folder = "categorias/" + slug(categoriaCanonica);
        String imagenUrl = portada.getImagenUrl() == null
                ? azureBlobStorageService.upload(file, folder)
                : azureBlobStorageService.replace(portada.getImagenUrl(), file, folder);

        portada.setImagenUrl(imagenUrl);
        CategoriaPortada guardada = categoriaPortadaRepository.save(portada);
        return new CategoriaPortadaResponse(guardada.getCategoria(), guardada.getImagenUrl());
    }

    private String categoriaCanonica(String categoria) {
        String value = String.valueOf(categoria == null ? "" : categoria).trim();
        return CATEGORIAS.stream()
                .filter(permitida -> permitida.equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new BusinessException("La categoria indicada no esta permitida."));
    }

    private String slug(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}
