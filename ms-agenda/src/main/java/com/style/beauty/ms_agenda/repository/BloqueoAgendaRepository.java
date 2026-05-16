package com.style.beauty.ms_agenda.repository;

import com.style.beauty.ms_agenda.entity.BloqueoAgenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface BloqueoAgendaRepository extends JpaRepository<BloqueoAgenda, UUID> {

    List<BloqueoAgenda> findByIdStaff(UUID idStaff);

    @Query("""
                SELECT b FROM BloqueoAgenda b
                WHERE (b.idStaff = :idStaff OR b.idStaff IS NULL)
                AND b.fechaHoraInicio < :fin
                AND b.fechaHoraFin > :inicio
            """)
    List<BloqueoAgenda> buscarBloqueosEnRango(UUID idStaff, OffsetDateTime inicio, OffsetDateTime fin);
}