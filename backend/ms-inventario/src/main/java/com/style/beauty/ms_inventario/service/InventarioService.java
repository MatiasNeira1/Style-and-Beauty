package com.style.beauty.ms_inventario.service;

import com.style.beauty.ms_inventario.dto.CrearProductoRequest;
import com.style.beauty.ms_inventario.dto.CrearStockRequest;
import com.style.beauty.ms_inventario.dto.MovimientoStockRequest;
import com.style.beauty.ms_inventario.entity.MovimientoStock;
import com.style.beauty.ms_inventario.entity.Producto;
import com.style.beauty.ms_inventario.entity.Stock;
import com.style.beauty.ms_inventario.enums.TipoMovimiento;
import com.style.beauty.ms_inventario.exception.BusinessException;
import com.style.beauty.ms_inventario.exception.ResourceNotFoundException;
import com.style.beauty.ms_inventario.repository.MovimientoStockRepository;
import com.style.beauty.ms_inventario.repository.ProductoRepository;
import com.style.beauty.ms_inventario.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private final ProductoRepository productoRepository;
    private final StockRepository stockRepository;
    private final MovimientoStockRepository movimientoStockRepository;

    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    public List<Producto> listarProductosActivos() {
        return productoRepository.findByActivoTrue();
    }

    public Producto buscarProducto(UUID id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
    }

    @Transactional
    public Producto crearProducto(CrearProductoRequest request) {
        Producto producto = Producto.builder()
                .nombre(request.nombre())
                .categoria(request.categoria())
                .descripcion(request.descripcion())
                .precio(request.precio())
                .activo(true)
                .build();

        return productoRepository.save(producto);
    }

    @Transactional
    public Producto actualizarProducto(UUID id, CrearProductoRequest request) {
        Producto producto = buscarProducto(id);

        producto.setNombre(request.nombre());
        producto.setCategoria(request.categoria());
        producto.setDescripcion(request.descripcion());
        producto.setPrecio(request.precio());

        return productoRepository.save(producto);
    }

    @Transactional
    public Producto desactivarProducto(UUID id) {
        Producto producto = buscarProducto(id);
        producto.setActivo(false);
        return productoRepository.save(producto);
    }

    @Transactional
    public void eliminarProducto(UUID id) {
        Producto producto = buscarProducto(id);
        movimientoStockRepository.deleteByIdProducto(id);
        stockRepository.deleteByIdProducto(id);
        productoRepository.delete(producto);
    }

    public List<Stock> listarStock() {
        return stockRepository.findAll();
    }

    public Stock buscarStockPorProducto(UUID idProducto) {
        return stockRepository.findByIdProducto(idProducto)
                .orElseThrow(() -> new ResourceNotFoundException("Stock no encontrado para el producto"));
    }

    @Transactional
    public Stock crearStock(CrearStockRequest request) {
        buscarProducto(request.idProducto());

        if (stockRepository.findByIdProducto(request.idProducto()).isPresent()) {
            throw new BusinessException("El producto ya tiene stock registrado");
        }

        Stock stock = Stock.builder()
                .idProducto(request.idProducto())
                .cantidadActual(request.cantidadActual())
                .unidadMedida(request.unidadMedida())
                .stockMinimo(request.stockMinimo())
                .build();

        return stockRepository.save(stock);
    }

    @Transactional
    public MovimientoStock registrarMovimiento(MovimientoStockRequest request) {
        buscarProducto(request.idProducto());

        Stock stock = buscarStockPorProducto(request.idProducto());

        if (request.cantidad() <= 0) {
            throw new BusinessException("La cantidad debe ser mayor a 0");
        }

        if (request.tipoMovimiento() == TipoMovimiento.ENTRADA) {
            stock.setCantidadActual(stock.getCantidadActual() + request.cantidad());
        }

        if (request.tipoMovimiento() == TipoMovimiento.SALIDA) {
            if (stock.getCantidadActual() < request.cantidad()) {
                throw new BusinessException("Stock insuficiente para realizar la salida");
            }

            stock.setCantidadActual(stock.getCantidadActual() - request.cantidad());
        }

        if (request.tipoMovimiento() == TipoMovimiento.AJUSTE) {
            stock.setCantidadActual(request.cantidad());
        }

        Stock stockActualizado = stockRepository.save(stock);

        MovimientoStock movimiento = MovimientoStock.builder()
                .idProducto(request.idProducto())
                .idStock(stockActualizado.getIdStock())
                .tipoMovimiento(request.tipoMovimiento())
                .cantidad(request.cantidad())
                .motivo(request.motivo())
                .usuarioResponsable(request.usuarioResponsable())
                .build();

        return movimientoStockRepository.save(movimiento);
    }

    public List<MovimientoStock> listarMovimientosPorProducto(UUID idProducto) {
        buscarProducto(idProducto);
        return movimientoStockRepository.findByIdProducto(idProducto);
    }
}
