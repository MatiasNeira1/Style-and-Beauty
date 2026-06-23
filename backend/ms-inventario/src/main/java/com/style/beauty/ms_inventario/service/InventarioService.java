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
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private static final int STOCK_INICIAL_DEFAULT = 0;
    private static final int STOCK_MINIMO_DEFAULT = 5;
    private static final String UNIDAD_MEDIDA_DEFAULT = "unidad";

    private final ProductoRepository productoRepository;
    private final StockRepository stockRepository;
    private final MovimientoStockRepository movimientoStockRepository;
    private final AzureBlobStorageService azureBlobStorageService;

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
                .imagenUrl(request.imagenUrl())
                .precio(request.precio())
                .activo(true)
                .build();

        validarProducto(producto);
        validarStock(request.stockInicial(), request.stockMinimo());
        Producto productoGuardado = productoRepository.save(producto);
        crearStockInicial(productoGuardado.getIdProducto(), request.stockInicial(), request.unidadMedida(), request.stockMinimo());
        return productoGuardado;
    }

    @Transactional
    public Producto crearProductoConImagen(
            String nombre,
            String categoria,
            String descripcion,
            BigDecimal precio,
            Integer stockInicial,
            String unidadMedida,
            Integer stockMinimo,
            MultipartFile file) {
        Producto producto = Producto.builder()
                .nombre(nombre)
                .categoria(categoria)
                .descripcion(descripcion)
                .precio(precio)
                .activo(true)
                .build();

        validarProductoBase(producto);
        validarStock(stockInicial, stockMinimo);
        producto.setImagenUrl(azureBlobStorageService.upload(file, "productos"));
        validarProducto(producto);
        Producto productoGuardado = productoRepository.save(producto);
        crearStockInicial(productoGuardado.getIdProducto(), stockInicial, unidadMedida, stockMinimo);
        return productoGuardado;
    }

    @Transactional
    public Producto actualizarProducto(UUID id, CrearProductoRequest request) {
        Producto producto = buscarProducto(id);

        producto.setNombre(request.nombre());
        producto.setCategoria(request.categoria());
        producto.setDescripcion(request.descripcion());
        if (request.imagenUrl() != null) {
            producto.setImagenUrl(request.imagenUrl());
        }
        producto.setPrecio(request.precio());

        validarProducto(producto);
        return productoRepository.save(producto);
    }

    @Transactional
    public Producto actualizarImagenProducto(UUID id, MultipartFile file) {
        Producto producto = buscarProducto(id);
        String imageUrl = azureBlobStorageService.replace(producto.getImagenUrl(), file, "productos");
        producto.setImagenUrl(imageUrl);
        return productoRepository.save(producto);
    }

    @Transactional
    public Producto eliminarImagenProducto(UUID id) {
        buscarProducto(id);
        throw new BusinessException("Los productos deben mantener una imagen publicada.");
    }

    @Transactional
    public Producto desactivarProducto(UUID id) {
        Producto producto = buscarProducto(id);
        producto.setActivo(false);
        return productoRepository.save(producto);
    }

    @Transactional
    public Producto activarProducto(UUID id) {
        Producto producto = buscarProducto(id);
        producto.setActivo(true);
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
        validarStock(request.cantidadActual(), request.stockMinimo());

        if (stockRepository.findByIdProducto(request.idProducto()).isPresent()) {
            throw new BusinessException("El producto ya tiene stock registrado");
        }

        Stock stock = Stock.builder()
                .idProducto(request.idProducto())
                .cantidadActual(request.cantidadActual())
                .unidadMedida(normalizarUnidadMedida(request.unidadMedida()))
                .stockMinimo(normalizarStockMinimo(request.stockMinimo()))
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

    private void validarProducto(Producto producto) {
        validarProductoBase(producto);
        if (producto.getImagenUrl() == null || producto.getImagenUrl().isBlank()) {
            throw new BusinessException("La imagen del producto es obligatoria.");
        }
    }

    private void validarProductoBase(Producto producto) {
        if (producto.getNombre() == null || producto.getNombre().isBlank()) {
            throw new BusinessException("El nombre del producto es obligatorio.");
        }
        if (producto.getCategoria() == null || producto.getCategoria().isBlank()) {
            throw new BusinessException("La categoria del producto es obligatoria.");
        }
        if (producto.getPrecio() == null || producto.getPrecio().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("El precio del producto debe ser valido.");
        }
    }

    private Stock crearStockInicial(UUID idProducto, Integer stockInicial, String unidadMedida, Integer stockMinimo) {
        validarStock(stockInicial, stockMinimo);
        Stock stock = Stock.builder()
                .idProducto(idProducto)
                .cantidadActual(normalizarStockInicial(stockInicial))
                .unidadMedida(normalizarUnidadMedida(unidadMedida))
                .stockMinimo(normalizarStockMinimo(stockMinimo))
                .build();
        return stockRepository.save(stock);
    }

    private void validarStock(Integer cantidad, Integer stockMinimo) {
        if (cantidad != null && cantidad < 0) {
            throw new BusinessException("El stock no puede ser negativo.");
        }
        if (stockMinimo != null && stockMinimo < 0) {
            throw new BusinessException("El stock minimo no puede ser negativo.");
        }
    }

    private int normalizarStockInicial(Integer stockInicial) {
        return stockInicial == null ? STOCK_INICIAL_DEFAULT : stockInicial;
    }

    private int normalizarStockMinimo(Integer stockMinimo) {
        return stockMinimo == null ? STOCK_MINIMO_DEFAULT : stockMinimo;
    }

    private String normalizarUnidadMedida(String unidadMedida) {
        return unidadMedida == null || unidadMedida.isBlank() ? UNIDAD_MEDIDA_DEFAULT : unidadMedida.trim();
    }
}
