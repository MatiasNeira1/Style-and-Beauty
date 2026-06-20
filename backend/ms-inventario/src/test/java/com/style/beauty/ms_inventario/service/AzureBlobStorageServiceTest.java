package com.style.beauty.ms_inventario.service;

import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.BlobClient;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

class AzureBlobStorageServiceTest {
    private final AzureBlobStorageService storageService = new AzureBlobStorageService("", "stylebeauty");

    @Test
    void validateImageAcceptsAllowedImage() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "producto.png",
                "image/png",
                new byte[] {1, 2, 3}
        );

        storageService.validateImage(file);
    }

    @Test
    void validateImageRejectsFilesOverFiveMb() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "producto.webp",
                "image/webp",
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
                "producto.pdf",
                "application/pdf",
                new byte[] {1}
        );

        assertThatThrownBy(() -> storageService.validateImage(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("JPG");
    }

    @Test
    void extractBlobNameFromUrlRemovesContainerPrefix() {
        String blobName = storageService.extractBlobNameFromUrl(
                "https://account.blob.core.windows.net/stylebeauty/productos/serum%20facial.png"
        );

        assertThat(blobName).isEqualTo("productos/serum facial.png");
    }

    @Test
    void azureSdkEncodesVirtualDirectorySeparator() {
        BlobContainerClient containerClient = new BlobServiceClientBuilder()
                .endpoint("https://stylebeautyimages.blob.core.windows.net")
                .buildClient()
                .getBlobContainerClient("stylebeauty");

        String blobUrl = containerClient
                .getBlobClient("productos/archivo.webp")
                .getBlobUrl();

        assertThat(blobUrl).endsWith("/stylebeauty/productos%2Farchivo.webp");
    }

    @Test
    void publicBlobUrlPreservesTheUploadedBlobNameAndDecodesOnlyFolderSeparators() {
        BlobClient blobClient = mock(BlobClient.class);
        when(blobClient.getBlobUrl()).thenReturn(
                "https://stylebeautyimages.blob.core.windows.net/stylebeauty/productos%2F4966e110-producto.webp"
        );

        String blobUrl = storageService.publicBlobUrl(
                blobClient,
                "productos/4966e110-producto.webp"
        );

        assertThat(blobUrl).isEqualTo(
                "https://stylebeautyimages.blob.core.windows.net/stylebeauty/productos/4966e110-producto.webp"
        );
        assertThat(storageService.extractBlobNameFromUrl(blobUrl))
                .isEqualTo("productos/4966e110-producto.webp");
    }

    @Test
    void publicBlobUrlRejectsAUrlForAnotherBlob() {
        BlobClient blobClient = mock(BlobClient.class);
        when(blobClient.getBlobUrl()).thenReturn(
                "https://stylebeautyimages.blob.core.windows.net/stylebeauty/productos%2Fotro.webp"
        );

        assertThatThrownBy(() -> storageService.publicBlobUrl(blobClient, "productos/esperado.webp"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no corresponde");
    }

    @Test
    void uploadUsesOneBlobNameForAzureAndReturnedUrl() throws Exception {
        BlobContainerClient containerClient = mock(BlobContainerClient.class);
        BlobClient blobClient = mock(BlobClient.class);
        AzureBlobStorageService service = new AzureBlobStorageService(containerClient, "stylebeauty");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "Shampoo de reparacion extrema.webp",
                "image/webp",
                new byte[] {1, 2, 3}
        );

        when(containerClient.getBlobClient(anyString())).thenAnswer(invocation -> {
            String blobName = invocation.getArgument(0);
            when(blobClient.getBlobUrl()).thenReturn(
                    "https://stylebeautyimages.blob.core.windows.net/stylebeauty/"
                            + blobName.replace("/", "%2F")
            );
            return blobClient;
        });

        String blobUrl = service.upload(file, "productos");

        ArgumentCaptor<String> blobNameCaptor = ArgumentCaptor.forClass(String.class);
        verify(containerClient, times(1)).getBlobClient(blobNameCaptor.capture());
        String uploadedBlobName = blobNameCaptor.getValue();
        assertThat(uploadedBlobName)
                .startsWith("productos/")
                .endsWith("-shampoo-de-reparacion-extrema.webp");
        assertThat(blobUrl).isEqualTo(
                "https://stylebeautyimages.blob.core.windows.net/stylebeauty/" + uploadedBlobName
        );
        verify(blobClient, times(1)).upload(any(InputStream.class), eq(file.getSize()), eq(true));
    }

    @Test
    void publicBlobUrlPreservesNestedCategoryFolderSeparators() {
        BlobClient blobClient = mock(BlobClient.class);
        when(blobClient.getBlobUrl()).thenReturn(
                "https://stylebeautyimages.blob.core.windows.net/stylebeauty/categorias%2Fcabello%2Fuuid-portada.webp"
        );

        String blobUrl = storageService.publicBlobUrl(
                blobClient,
                "categorias/cabello/uuid-portada.webp"
        );

        assertThat(blobUrl).isEqualTo(
                "https://stylebeautyimages.blob.core.windows.net/stylebeauty/categorias/cabello/uuid-portada.webp"
        );
        assertThat(blobUrl).doesNotContain("%2F");
    }
}
