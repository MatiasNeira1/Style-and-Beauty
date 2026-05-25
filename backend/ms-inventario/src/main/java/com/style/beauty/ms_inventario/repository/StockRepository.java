package com.style.beauty.ms_inventario.repository;

import com.style.beauty.ms_inventario.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StockRepository extends JpaRepository<Stock, UUID> {

    Optional<Stock> findByIdProducto(UUID idProducto);

    void deleteByIdProducto(UUID idProducto);
}
