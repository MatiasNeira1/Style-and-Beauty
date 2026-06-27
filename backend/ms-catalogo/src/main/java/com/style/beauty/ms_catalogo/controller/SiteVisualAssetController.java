package com.style.beauty.ms_catalogo.controller;

import com.style.beauty.ms_catalogo.dto.SiteVisualAssetResponse;
import com.style.beauty.ms_catalogo.service.SiteVisualAssetService;
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
@RequestMapping("/api/catalogo/site-visual-assets")
public class SiteVisualAssetController {
    private final SiteVisualAssetService service;

    public SiteVisualAssetController(SiteVisualAssetService service) {
        this.service = service;
    }

    @GetMapping
    public List<SiteVisualAssetResponse> listarAssets() {
        return service.listarAssets();
    }

    @PostMapping(value = "/{assetKey}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SiteVisualAssetResponse guardarAsset(
            @PathVariable String assetKey,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "altText", required = false) String altText,
            @RequestParam(value = "section", required = false) String section,
            @RequestParam(value = "objectPosition", required = false) String objectPosition,
            @RequestParam(value = "active", required = false) Boolean active) {
        return service.guardarAsset(assetKey, file, title, description, altText, section, objectPosition, active);
    }
}
