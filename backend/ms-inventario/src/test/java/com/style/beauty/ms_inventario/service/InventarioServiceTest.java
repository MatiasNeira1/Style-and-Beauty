package com.style.beauty.ms_inventario.service;

import com.style.beauty.ms_inventario.entity.Producto;
import com.style.beauty.ms_inventario.repository.MovimientoStockRepository;
import com.style.beauty.ms_inventario.repository.ProductoRepository;
import com.style.beauty.ms_inventario.repository.StockRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventarioServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private StockRepository stockRepository;

    @Mock
    private MovimientoStockRepository movimientoStockRepository;

    @Mock
    private AzureBlobStorageService azureBlobStorageService;

    @InjectMocks
    private InventarioService inventarioService;

    @Test
    void actualizarImagenPersisteYDevuelveLaUrlExactaDelUpload() {
        UUID idProducto = UUID.randomUUID();
        Producto producto = Producto.builder()
                .idProducto(idProducto)
                .imagenUrl("https://stylebeautyimages.blob.core.windows.net/stylebeauty/productos/anterior.webp")
                .build();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "producto.webp",
                "image/webp",
                new byte[] {1, 2, 3}
        );
        String uploadedUrl = "https://stylebeautyimages.blob.core.windows.net/stylebeauty/productos/4966e110-producto.webp";

        when(productoRepository.findById(idProducto)).thenReturn(Optional.of(producto));
        when(azureBlobStorageService.replace(producto.getImagenUrl(), file, "productos"))
                .thenReturn(uploadedUrl);
        when(productoRepository.save(any(Producto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Producto actualizado = inventarioService.actualizarImagenProducto(idProducto, file);

        assertThat(actualizado.getImagenUrl()).isEqualTo(uploadedUrl);
        verify(productoRepository).save(producto);
    }

    @Test
    void activarProductoPersisteYDevuelveElProductoActivo() {
        UUID idProducto = UUID.randomUUID();
        Producto producto = Producto.builder()
                .idProducto(idProducto)
                .activo(false)
                .build();

        when(productoRepository.findById(idProducto)).thenReturn(Optional.of(producto));
        when(productoRepository.save(any(Producto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Producto actualizado = inventarioService.activarProducto(idProducto);

        assertThat(actualizado.getActivo()).isTrue();
        verify(productoRepository).save(producto);
    }
}
