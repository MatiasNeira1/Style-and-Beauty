package com.style.beauty.ms_catalogo.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AzureBlobStorageService {
    public static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024L * 1024L;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");

    private final String connectionString;
    private final String containerName;
    private BlobContainerClient cachedContainerClient;

    @Autowired
    public AzureBlobStorageService(
            @Value("${azure.storage.connection-string:${AZURE_STORAGE_CONNECTION_STRING:}}") String connectionString,
            @Value("${azure.storage.container:${AZURE_STORAGE_CONTAINER:stylebeauty}}") String containerName) {
        this.connectionString = connectionString;
        this.containerName = containerName;
    }

    AzureBlobStorageService(BlobContainerClient containerClient, String containerName) {
        this.connectionString = "";
        this.containerName = containerName;
        this.cachedContainerClient = containerClient;
    }

    public String upload(MultipartFile file, String folder) {
        validateImage(file);

        String blobName = buildBlobName(file.getOriginalFilename(), folder);
        BlobClient blobClient = containerClient().getBlobClient(blobName);

        try {
            blobClient.upload(file.getInputStream(), file.getSize(), true);
            blobClient.setHttpHeaders(new BlobHttpHeaders().setContentType(file.getContentType()));
            return blobClient.getBlobUrl();
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo leer la imagen para subirla a Azure Blob Storage.", e);
        }
    }

    public void delete(String blobUrl) {
        String blobName = extractBlobNameFromUrl(blobUrl);
        if (blobName == null || blobName.isBlank()) {
            return;
        }

        containerClient().getBlobClient(blobName).deleteIfExists();
    }

    public String replace(String oldBlobUrl, MultipartFile newFile, String folder) {
        validateImage(newFile);
        if (oldBlobUrl != null && !oldBlobUrl.isBlank()) {
            delete(oldBlobUrl);
        }
        return upload(newFile, folder);
    }

    public String extractBlobNameFromUrl(String blobUrl) {
        if (blobUrl == null || blobUrl.isBlank()) {
            return null;
        }

        try {
            URI uri = URI.create(blobUrl.trim());
            String path = uri.getPath();
            if (path == null || path.isBlank()) {
                return null;
            }

            String normalizedPath = path.startsWith("/") ? path.substring(1) : path;
            String containerPrefix = containerName + "/";
            if (normalizedPath.startsWith(containerPrefix)) {
                normalizedPath = normalizedPath.substring(containerPrefix.length());
            }

            return URLDecoder.decode(normalizedPath, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("La URL del blob no es valida.", e);
        }
    }

    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debes enviar una imagen.");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("La imagen no puede superar 5 MB.");
        }

        String extension = extractExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Solo se permiten imagenes JPG, JPEG, PNG o WEBP.");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!contentType.isBlank() && !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("El tipo de archivo no es una imagen permitida.");
        }
    }

    private BlobContainerClient containerClient() {
        if (cachedContainerClient != null) {
            return cachedContainerClient;
        }
        if (connectionString == null || connectionString.isBlank()) {
            throw new IllegalStateException("AZURE_STORAGE_CONNECTION_STRING no esta configurada.");
        }
        if (containerName == null || containerName.isBlank()) {
            throw new IllegalStateException("AZURE_STORAGE_CONTAINER no esta configurada.");
        }

        cachedContainerClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient()
                .getBlobContainerClient(containerName);
        cachedContainerClient.createIfNotExists();
        return cachedContainerClient;
    }

    private String buildBlobName(String originalFilename, String folder) {
        String safeFolder = sanitizeFolder(folder);
        String extension = extractExtension(originalFilename);
        String safeBaseName = sanitizeBaseName(originalFilename);
        return safeFolder + "/" + UUID.randomUUID() + "-" + safeBaseName + "." + extension;
    }

    private String sanitizeFolder(String folder) {
        String value = folder == null || folder.isBlank() ? "general" : folder.trim();
        value = value.replace('\\', '/').toLowerCase(Locale.ROOT);
        value = value.replaceAll("[^a-z0-9/_-]", "-");
        value = value.replaceAll("/{2,}", "/").replaceAll("^/|/$", "");
        return value.isBlank() ? "general" : value;
    }

    private String sanitizeBaseName(String originalFilename) {
        String filename = originalFilename == null || originalFilename.isBlank() ? "imagen" : originalFilename;
        int dotIndex = filename.lastIndexOf('.');
        String baseName = dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
        String normalized = Normalizer.normalize(baseName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9_-]", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");
        return normalized.isBlank() ? "imagen" : normalized;
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null) {
            return "";
        }
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalFilename.length() - 1) {
            return "";
        }
        return originalFilename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }
}
