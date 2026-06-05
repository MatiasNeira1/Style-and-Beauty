package com.style.beauty.ms_catalogo.repository;

import com.style.beauty.ms_catalogo.entity.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServicioRepository extends JpaRepository<Servicio, UUID> {

    List<Servicio> findByCategoriaIgnoreCase(String categoria);

    List<Servicio> findByActivoTrue();

    List<Servicio> findByCategoriaIgnoreCaseAndActivoTrue(String categoria);
}