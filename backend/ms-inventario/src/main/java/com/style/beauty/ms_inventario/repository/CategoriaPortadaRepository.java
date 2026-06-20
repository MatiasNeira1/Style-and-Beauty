package com.style.beauty.ms_inventario.repository;

import com.style.beauty.ms_inventario.entity.CategoriaPortada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CategoriaPortadaRepository extends JpaRepository<CategoriaPortada, UUID> {
    Optional<CategoriaPortada> findByCategoriaIgnoreCase(String categoria);
}
