package com.style.beauty.ms_agenda.repository;

import com.style.beauty.ms_agenda.entity.HistorialCita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HistorialCitaRepository extends JpaRepository<HistorialCita, UUID> {

    List<HistorialCita> findByIdCita(UUID idCita);
}