package com.style.beauty.ms_catalogo.repository;

import com.style.beauty.ms_catalogo.entity.CategoriaServicioPortada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CategoriaServicioPortadaRepository extends JpaRepository<CategoriaServicioPortada, UUID> {
    Optional<CategoriaServicioPortada> findByCategoriaIgnoreCase(String categoria);
}
