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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventario")
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

    @PostMapping("/productos")
    public Producto crearProducto(@Valid @RequestBody CrearProductoRequest request) {
        return inventarioService.crearProducto(request);
    }

    @PutMapping("/productos/{id}")
    public Producto actualizarProducto(
            @PathVariable UUID id,
            @Valid @RequestBody CrearProductoRequest request) {
        return inventarioService.actualizarProducto(id, request);
    }

    @PatchMapping("/productos/{id}/desactivar")
    public Producto desactivarProducto(@PathVariable UUID id) {
        return inventarioService.desactivarProducto(id);
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
