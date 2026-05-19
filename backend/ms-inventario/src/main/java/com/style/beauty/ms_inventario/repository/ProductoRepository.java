package com.style.beauty.ms_inventario.repository;

import com.style.beauty.ms_inventario.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductoRepository extends JpaRepository<Producto, UUID> {

    List<Producto> findByActivoTrue();

    List<Producto> findByCategoriaIgnoreCase(String categoria);
}