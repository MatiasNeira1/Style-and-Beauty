package com.style.beauty.ms_inventario.service;

import com.style.beauty.ms_inventario.dto.CrearProductoRequest;
import com.style.beauty.ms_inventario.dto.CrearStockRequest;
import com.style.beauty.ms_inventario.entity.Producto;
import com.style.beauty.ms_inventario.entity.Stock;
import com.style.beauty.ms_inventario.exception.BusinessException;
import com.style.beauty.ms_inventario.repository.MovimientoStockRepository;
import com.style.beauty.ms_inventario.repository.ProductoRepository;
import com.style.beauty.ms_inventario.repository.StockRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
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
    void crearProductoCreaStockInicialCeroPorDefecto() {
        UUID idProducto = UUID.randomUUID();
        CrearProductoRequest request = new CrearProductoRequest(
                "Serum facial",
                "Spa",
                "Producto profesional",
                "https://stylebeautyimages.blob.core.windows.net/stylebeauty/productos/serum.webp",
                BigDecimal.valueOf(12990),
                null,
                null,
                null
        );

        when(productoRepository.save(any(Producto.class))).thenAnswer(invocation -> {
            Producto producto = invocation.getArgument(0);
            producto.setIdProducto(idProducto);
            return producto;
        });
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Producto creado = inventarioService.crearProducto(request);

        ArgumentCaptor<Stock> stockCaptor = ArgumentCaptor.forClass(Stock.class);
        verify(stockRepository).save(stockCaptor.capture());
        assertThat(creado.getIdProducto()).isEqualTo(idProducto);
        assertThat(stockCaptor.getValue().getIdProducto()).isEqualTo(idProducto);
        assertThat(stockCaptor.getValue().getCantidadActual()).isZero();
        assertThat(stockCaptor.getValue().getUnidadMedida()).isEqualTo("unidad");
        assertThat(stockCaptor.getValue().getStockMinimo()).isEqualTo(5);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 5, 6})
    void crearProductoCreaStockInicialSolicitado(int stockInicial) {
        UUID idProducto = UUID.randomUUID();
        CrearProductoRequest request = new CrearProductoRequest(
                "Serum facial",
                "Spa",
                "Producto profesional",
                "https://stylebeautyimages.blob.core.windows.net/stylebeauty/productos/serum.webp",
                BigDecimal.valueOf(12990),
                stockInicial,
                "unidad",
                5
        );

        when(productoRepository.save(any(Producto.class))).thenAnswer(invocation -> {
            Producto producto = invocation.getArgument(0);
            producto.setIdProducto(idProducto);
            return producto;
        });
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        inventarioService.crearProducto(request);

        ArgumentCaptor<Stock> stockCaptor = ArgumentCaptor.forClass(Stock.class);
        verify(stockRepository).save(stockCaptor.capture());
        assertThat(stockCaptor.getValue().getCantidadActual()).isEqualTo(stockInicial);
    }

    @Test
    void crearStockRechazaCantidadNegativa() {
        UUID idProducto = UUID.randomUUID();
        CrearStockRequest request = new CrearStockRequest(idProducto, -1, "unidad", 5);

        when(productoRepository.findById(idProducto)).thenReturn(Optional.of(Producto.builder().idProducto(idProducto).build()));

        assertThatThrownBy(() -> inventarioService.crearStock(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("stock no puede ser negativo");

        verify(stockRepository, never()).save(any(Stock.class));
    }

    @Test
    void crearProductoConImagenRechazaStockInicialNegativoAntesDeSubirImagen() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "producto.webp",
                "image/webp",
                new byte[] {1, 2, 3}
        );

        assertThatThrownBy(() -> inventarioService.crearProductoConImagen(
                "Serum facial",
                "Spa",
                "Producto profesional",
                BigDecimal.valueOf(12990),
                -1,
                "unidad",
                5,
                file
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("stock no puede ser negativo");

        verify(azureBlobStorageService, never()).upload(any(), anyString());
        verify(productoRepository, never()).save(any(Producto.class));
    }

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
