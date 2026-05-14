package com.style.beauty.ms_extra.repository;

import com.style.beauty.ms_extra.entity.CitaExtraordinaria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CitaExtraordinariaRepository extends JpaRepository<CitaExtraordinaria, UUID> {

    List<CitaExtraordinaria> findByIdCliente(UUID idCliente);

    List<CitaExtraordinaria> findByIdStaff(UUID idStaff);
}