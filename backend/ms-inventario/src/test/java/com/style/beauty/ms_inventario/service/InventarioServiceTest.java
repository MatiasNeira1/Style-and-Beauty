package com.style.beauty.ms_inventario.service;

import com.style.beauty.ms_inventario.dto.CrearProductoRequest;
import com.style.beauty.ms_inventario.dto.CrearStockRequest;
import com.style.beauty.ms_inventario.dto.MovimientoStockRequest;
import com.style.beauty.ms_inventario.entity.MovimientoStock;
import com.style.beauty.ms_inventario.entity.Producto;
import com.style.beauty.ms_inventario.entity.Stock;
import com.style.beauty.ms_inventario.enums.TipoMovimiento;
import com.style.beauty.ms_inventario.exception.BusinessException;
import com.style.beauty.ms_inventario.repository.MovimientoStockRepository;
import com.style.beauty.ms_inventario.repository.ProductoRepository;
import com.style.beauty.ms_inventario.repository.StockRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class InventarioServiceTest {
    private final ProductoRepository productoRepository = mock(ProductoRepository.class);
    private final StockRepository stockRepository = mock(StockRepository.class);
    private final MovimientoStockRepository movimientoStockRepository = mock(MovimientoStockRepository.class);
    private final AzureBlobStorageService azureBlobStorageService = mock(AzureBlobStorageService.class);
    private final InventarioService service = new InventarioService(productoRepository, stockRepository, movimientoStockRepository, azureBlobStorageService);

    @Test
    void crearProductoPersisteProductoActivo() {
        when(productoRepository.save(any(Producto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Producto producto = service.crearProducto(new CrearProductoRequest("Shampoo", "Cabello", "Desc", "https://img.test/shampoo.jpg", BigDecimal.TEN));

        assertThat(producto.getActivo()).isTrue();
        assertThat(producto.getNombre()).isEqualTo("Shampoo");
    }

    @Test
    void crearProductoRechazaProductoSinImagen() {
        CrearProductoRequest request = new CrearProductoRequest("Shampoo", "Cabello", "Desc", "", BigDecimal.TEN);

        assertThatThrownBy(() -> service.crearProducto(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("imagen");
    }

    @Test
    void crearStockRechazaProductoConStockExistente() {
        UUID idProducto = UUID.randomUUID();
        when(productoRepository.findById(idProducto)).thenReturn(Optional.of(producto(idProducto)));
        when(stockRepository.findByIdProducto(idProducto)).thenReturn(Optional.of(Stock.builder().idProducto(idProducto).build()));

        assertThatThrownBy(() -> service.crearStock(new CrearStockRequest(idProducto, 10, "unidad", 2)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya tiene stock");
    }

    @Test
    void registrarMovimientoSalidaDescuentaStock() {
        UUID idProducto = UUID.randomUUID();
        Stock stock = Stock.builder().idStock(UUID.randomUUID()).idProducto(idProducto).cantidadActual(10).unidadMedida("unidad").build();
        when(productoRepository.findById(idProducto)).thenReturn(Optional.of(producto(idProducto)));
        when(stockRepository.findByIdProducto(idProducto)).thenReturn(Optional.of(stock));
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(movimientoStockRepository.save(any(MovimientoStock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MovimientoStock movimiento = service.registrarMovimiento(new MovimientoStockRequest(idProducto, TipoMovimiento.SALIDA, 4, "venta", UUID.randomUUID()));

        assertThat(stock.getCantidadActual()).isEqualTo(6);
        assertThat(movimiento.getTipoMovimiento()).isEqualTo(TipoMovimiento.SALIDA);
    }

    private Producto producto(UUID idProducto) {
        return Producto.builder()
                .idProducto(idProducto)
                .nombre("Shampoo")
                .categoria("Cabello")
                .imagenUrl("https://img.test/shampoo.jpg")
                .precio(BigDecimal.TEN)
                .activo(true)
                .build();
    }
}
