package com.style.beauty.ms_inventario.service;

import com.style.beauty.ms_inventario.dto.CategoriaPortadaResponse;
import com.style.beauty.ms_inventario.entity.CategoriaPortada;
import com.style.beauty.ms_inventario.repository.CategoriaPortadaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoriaPortadaServiceTest {
    @Mock
    private CategoriaPortadaRepository categoriaPortadaRepository;

    @Mock
    private AzureBlobStorageService azureBlobStorageService;

    @InjectMocks
    private CategoriaPortadaService categoriaPortadaService;

    @Test
    void listarPortadasIncluyeLasCincoCategoriasAunqueNoTenganImagen() {
        when(categoriaPortadaRepository.findAll()).thenReturn(List.of(
                CategoriaPortada.builder().categoria("Cabello").imagenUrl("https://cdn/cabello.webp").build()
        ));

        List<CategoriaPortadaResponse> portadas = categoriaPortadaService.listarPortadas();

        assertThat(portadas).extracting(CategoriaPortadaResponse::categoria)
                .containsExactly("Cabello", "Nails", "Cuidados de la piel", "Spa", "Maquillaje");
        assertThat(portadas.getFirst().imagenUrl()).isEqualTo("https://cdn/cabello.webp");
        assertThat(portadas.get(1).imagenUrl()).isNull();
    }

    @Test
    void actualizarPortadaNuevaUsaCarpetaDeCategoriaYPersisteUrlPublica() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "cabello.webp", "image/webp", new byte[] {1, 2, 3}
        );
        String uploadedUrl = "https://stylebeautyimages.blob.core.windows.net/stylebeauty/categorias/cabello/uuid-cabello.webp";
        when(categoriaPortadaRepository.findByCategoriaIgnoreCase("Cabello")).thenReturn(Optional.empty());
        when(azureBlobStorageService.upload(file, "categorias/cabello")).thenReturn(uploadedUrl);
        when(categoriaPortadaRepository.save(any(CategoriaPortada.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CategoriaPortadaResponse response = categoriaPortadaService.actualizarPortada("Cabello", file);

        assertThat(response.imagenUrl()).isEqualTo(uploadedUrl).doesNotContain("%2F");
        verify(azureBlobStorageService).upload(file, "categorias/cabello");
        verify(categoriaPortadaRepository).save(any(CategoriaPortada.class));
    }

    @Test
    void actualizarPortadaExistenteReemplazaSoloLaImagenDeSuCategoria() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "spa.png", "image/png", new byte[] {1, 2, 3}
        );
        CategoriaPortada portada = CategoriaPortada.builder()
                .categoria("Spa")
                .imagenUrl("https://stylebeautyimages.blob.core.windows.net/stylebeauty/categorias/spa/anterior.png")
                .build();
        String uploadedUrl = "https://stylebeautyimages.blob.core.windows.net/stylebeauty/categorias/spa/nueva.png";
        when(categoriaPortadaRepository.findByCategoriaIgnoreCase("Spa")).thenReturn(Optional.of(portada));
        when(azureBlobStorageService.replace(portada.getImagenUrl(), file, "categorias/spa"))
                .thenReturn(uploadedUrl);
        when(categoriaPortadaRepository.save(portada)).thenReturn(portada);

        CategoriaPortadaResponse response = categoriaPortadaService.actualizarPortada("Spa", file);

        assertThat(response.categoria()).isEqualTo("Spa");
        assertThat(response.imagenUrl()).isEqualTo(uploadedUrl);
        verify(azureBlobStorageService).replace(
                "https://stylebeautyimages.blob.core.windows.net/stylebeauty/categorias/spa/anterior.png",
                file,
                "categorias/spa"
        );
    }
}
