package com.style.beauty.ms_catalogo.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AzureBlobStorageServiceTest {
    private final AzureBlobStorageService storageService = new AzureBlobStorageService("", "stylebeauty");

    @Test
    void validateImageAcceptsAllowedImage() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "servicio.webp",
                "image/webp",
                new byte[] {1, 2, 3}
        );

        storageService.validateImage(file);
    }

    @Test
    void validateImageRejectsFilesOverFiveMb() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "servicio.png",
                "image/png",
                new byte[(int) AzureBlobStorageService.MAX_IMAGE_SIZE_BYTES + 1]
        );

        assertThatThrownBy(() -> storageService.validateImage(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5 MB");
    }

    @Test
    void validateImageRejectsInvalidExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "servicio.svg",
                "image/svg+xml",
                new byte[] {1}
        );

        assertThatThrownBy(() -> storageService.validateImage(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("JPG");
    }

    @Test
    void extractBlobNameFromUrlRemovesContainerPrefix() {
        String blobName = storageService.extractBlobNameFromUrl(
                "https://account.blob.core.windows.net/stylebeauty/servicios/corte%20premium.webp"
        );

        assertThat(blobName).isEqualTo("servicios/corte premium.webp");
    }
}
