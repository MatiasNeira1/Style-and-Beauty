package com.style.beauty.ms_inventario.controller;

import com.style.beauty.ms_inventario.dto.CrearProductoRequest;
import com.style.beauty.ms_inventario.dto.CrearStockRequest;
import com.style.beauty.ms_inventario.dto.MovimientoStockRequest;
import com.style.beauty.ms_inventario.entity.MovimientoStock;
import com.style.beauty.ms_inventario.entity.Producto;
import com.style.beauty.ms_inventario.entity.Stock;
import com.style.beauty.ms_inventario.service.InventarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventarios")
@RequiredArgsConstructor
public class InventarioController {

    private final InventarioService inventarioService;

    @GetMapping("/productos")
    public List<Producto> listarProductos() {
        return inventarioService.listarProductos();
    }

    @GetMapping("/productos/activos")
    public List<Producto> listarProductosActivos() {
        return inventarioService.listarProductosActivos();
    }

    @GetMapping("/productos/{id}")
    public Producto buscarProducto(@PathVariable UUID id) {
        return inventarioService.buscarProducto(id);
    }

    @PostMapping(value = "/productos", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Producto crearProducto(@Valid @RequestBody CrearProductoRequest request) {
        return inventarioService.crearProducto(request);
    }

    @PostMapping(value = "/productos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Producto crearProductoConImagen(
            @RequestParam String nombre,
            @RequestParam String categoria,
            @RequestParam(required = false) String descripcion,
            @RequestParam BigDecimal precio,
            @RequestParam(required = false) Integer stockInicial,
            @RequestParam(required = false) String unidadMedida,
            @RequestParam(required = false) Integer stockMinimo,
            @RequestParam("file") MultipartFile file) {
        return inventarioService.crearProductoConImagen(nombre, categoria, descripcion, precio, stockInicial, unidadMedida, stockMinimo, file);
    }

    @PutMapping("/productos/{id}")
    public Producto actualizarProducto(
            @PathVariable UUID id,
            @Valid @RequestBody CrearProductoRequest request) {
        return inventarioService.actualizarProducto(id, request);
    }

    @PostMapping("/productos/{id}/imagen")
    public Producto subirImagenProducto(@PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        return inventarioService.actualizarImagenProducto(id, file);
    }

    @DeleteMapping("/productos/{id}/imagen")
    public Producto eliminarImagenProducto(@PathVariable UUID id) {
        return inventarioService.eliminarImagenProducto(id);
    }

    @PatchMapping("/productos/{id}/desactivar")
    public Producto desactivarProducto(@PathVariable UUID id) {
        return inventarioService.desactivarProducto(id);
    }

    @PatchMapping("/productos/{id}/activar")
    public Producto activarProducto(@PathVariable UUID id) {
        return inventarioService.activarProducto(id);
    }

    @DeleteMapping("/productos/{id}")
    public void eliminarProducto(@PathVariable UUID id) {
        inventarioService.eliminarProducto(id);
    }

    @GetMapping("/stock")
    public List<Stock> listarStock() {
        return inventarioService.listarStock();
    }

    @GetMapping("/stock/producto/{idProducto}")
    public Stock buscarStockPorProducto(@PathVariable UUID idProducto) {
        return inventarioService.buscarStockPorProducto(idProducto);
    }

    @PostMapping("/stock")
    public Stock crearStock(@Valid @RequestBody CrearStockRequest request) {
        return inventarioService.crearStock(request);
    }

    @PostMapping("/movimientos")
    public MovimientoStock registrarMovimiento(@Valid @RequestBody MovimientoStockRequest request) {
        return inventarioService.registrarMovimiento(request);
    }

    @GetMapping("/movimientos/producto/{idProducto}")
    public List<MovimientoStock> listarMovimientosPorProducto(@PathVariable UUID idProducto) {
        return inventarioService.listarMovimientosPorProducto(idProducto);
    }
}
