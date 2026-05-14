package com.style.beauty.ms_inventario.repository;

import com.style.beauty.ms_inventario.entity.MovimientoStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, UUID> {

    List<MovimientoStock> findByIdProducto(UUID idProducto);

    void deleteByIdProducto(UUID idProducto);
}
