package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.dto.SiteVisualAssetResponse;
import com.style.beauty.ms_catalogo.entity.SiteVisualAsset;
import com.style.beauty.ms_catalogo.repository.SiteVisualAssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SiteVisualAssetService {
    private static final List<AssetDefinition> DEFINITIONS = List.of(
            new AssetDefinition("home.hero", "Home / Dashboard publico", "Imagen principal de la pantalla de inicio.", "Home", "Salon Style and Beauty", "center 28%"),
            new AssetDefinition("services.hero", "Hero principal de Servicios", "Cabecera del catalogo publico de servicios.", "Servicios", "Servicios Style and Beauty", "center 42%"),
            new AssetDefinition("services.category.nails", "Hero de categoria Nails", "Imagen para la categoria Nails.", "Categorias de servicios", "Servicios de nails", "center"),
            new AssetDefinition("services.category.cabello", "Hero de categoria Cabello", "Imagen para la categoria Cabello.", "Categorias de servicios", "Servicios de cabello", "center 36%"),
            new AssetDefinition("services.category.piel", "Hero de categoria Cuidados de la piel", "Imagen para la categoria Cuidados de la piel.", "Categorias de servicios", "Cuidados de la piel", "center"),
            new AssetDefinition("services.category.spa", "Hero de categoria Spa", "Imagen para la categoria Spa.", "Categorias de servicios", "Servicios de spa", "center"),
            new AssetDefinition("services.category.maquillaje", "Hero de categoria Maquillaje", "Imagen para la categoria Maquillaje.", "Categorias de servicios", "Servicios de maquillaje", "center"),
            new AssetDefinition("professionals.hero", "Hero de Profesionales", "Cabecera del directorio publico de profesionales.", "Profesionales", "Equipo profesional Style and Beauty", "center 28%"),
            new AssetDefinition("products.hero", "Hero de Productos", "Cabecera de la vitrina publica de productos.", "Productos", "Productos profesionales Style and Beauty", "center 42%"),
            new AssetDefinition("booking.hero", "Hero de Reservar", "Cabecera del flujo de reserva publica.", "Reservar", "Agenda de reservas Style and Beauty", "center 42%"),
            new AssetDefinition("contact.hero", "Hero de Contacto", "Cabecera de la pagina de contacto.", "Contacto", "Contacto Style and Beauty", "center"),
            new AssetDefinition("about.hero", "Hero de Nosotros", "Cabecera de la pagina institucional.", "Nosotros", "Salon Style and Beauty", "center 42%")
    );
    private static final Set<String> VALID_ASSET_KEYS = DEFINITIONS.stream()
            .map(AssetDefinition::assetKey)
            .collect(Collectors.toUnmodifiableSet());

    private final SiteVisualAssetRepository repository;
    private final AzureBlobStorageService azureBlobStorageService;

    public SiteVisualAssetService(
            SiteVisualAssetRepository repository,
            AzureBlobStorageService azureBlobStorageService) {
        this.repository = repository;
        this.azureBlobStorageService = azureBlobStorageService;
    }

    @Transactional(readOnly = true)
    public List<SiteVisualAssetResponse> listarAssets() {
        Map<String, SiteVisualAsset> savedAssets = repository.findAll().stream()
                .collect(Collectors.toMap(SiteVisualAsset::getAssetKey, Function.identity(), (first, second) -> first));

        return DEFINITIONS.stream()
                .map(definition -> toResponse(savedAssets.get(definition.assetKey()), definition))
                .toList();
    }

    @Transactional
    public SiteVisualAssetResponse guardarAsset(
            String assetKey,
            MultipartFile file,
            String title,
            String description,
            String altText,
            String section,
            String objectPosition,
            Boolean active) {
        AssetDefinition definition = definitionFor(assetKey);
        SiteVisualAsset asset = repository.findByAssetKey(definition.assetKey())
                .orElseGet(() -> {
                    SiteVisualAsset created = new SiteVisualAsset();
                    created.setAssetKey(definition.assetKey());
                    created.setTitle(definition.title());
                    created.setDescription(definition.description());
                    created.setAltText(definition.altText());
                    created.setSection(definition.section());
                    created.setObjectPosition(definition.objectPosition());
                    created.setActive(true);
                    return created;
                });

        asset.setTitle(textOrDefault(title, definition.title(), 140));
        asset.setDescription(textOrDefault(description, definition.description(), 600));
        asset.setAltText(textOrDefault(altText, definition.altText(), 220));
        asset.setSection(textOrDefault(section, definition.section(), 80));
        asset.setObjectPosition(normalizeObjectPosition(objectPosition, definition.objectPosition()));
        asset.setActive(active == null || active);

        if (file != null && !file.isEmpty()) {
            String folder = "site-visual-assets/" + slug(definition.assetKey());
            asset.setImageUrl(azureBlobStorageService.upload(file, folder));
        }

        return toResponse(repository.save(asset), definition);
    }

    private AssetDefinition definitionFor(String assetKey) {
        String normalized = assetKey == null ? "" : assetKey.trim().toLowerCase(Locale.ROOT);
        if (!VALID_ASSET_KEYS.contains(normalized)) {
            throw new IllegalArgumentException("La imagen principal solicitada no existe.");
        }
        return DEFINITIONS.stream()
                .filter(definition -> definition.assetKey().equals(normalized))
                .findFirst()
                .orElseThrow();
    }

    private SiteVisualAssetResponse toResponse(SiteVisualAsset asset, AssetDefinition definition) {
        if (asset == null) {
            return new SiteVisualAssetResponse(
                    definition.assetKey(),
                    definition.title(),
                    definition.description(),
                    null,
                    definition.altText(),
                    definition.section(),
                    definition.objectPosition(),
                    true
            );
        }

        return new SiteVisualAssetResponse(
                definition.assetKey(),
                textOrDefault(asset.getTitle(), definition.title(), 140),
                textOrDefault(asset.getDescription(), definition.description(), 600),
                asset.getImageUrl(),
                textOrDefault(asset.getAltText(), definition.altText(), 220),
                textOrDefault(asset.getSection(), definition.section(), 80),
                normalizeObjectPosition(asset.getObjectPosition(), definition.objectPosition()),
                asset.isActive()
        );
    }

    private String textOrDefault(String value, String fallback, int maxLength) {
        String text = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (text.isBlank()) return fallback;
        if (text.length() > maxLength) return text.substring(0, maxLength).trim();
        return text;
    }

    private String normalizeObjectPosition(String value, String fallback) {
        String text = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (text.isBlank()) return fallback;
        if (text.length() > 80) {
            throw new IllegalArgumentException("La posicion de la imagen no puede superar 80 caracteres.");
        }
        if (!text.matches("^[a-zA-Z0-9 %.-]+$")) {
            throw new IllegalArgumentException("La posicion de la imagen no es valida.");
        }
        return text;
    }

    private String slug(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private record AssetDefinition(
            String assetKey,
            String title,
            String description,
            String section,
            String altText,
            String objectPosition
    ) {
    }
}
