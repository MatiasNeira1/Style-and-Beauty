package com.style.beauty.ms_agenda.repository;

import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.enums.EstadoCita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;


public interface CitaRepository extends JpaRepository<Cita, UUID> {

    List<Cita> findByIdStaff(UUID idStaff);

    @Query("""
        SELECT c FROM Cita c
        WHERE c.idStaff = :idStaff
        AND c.estadoCita NOT IN :estadosIgnorados
        AND c.fechaHoraInicio < :fin
        AND c.fechaHoraFin > :inicio
    """)
    List<Cita> buscarChoquesAgenda(
            UUID idStaff,
            OffsetDateTime inicio,
            OffsetDateTime fin,
            List<EstadoCita> estadosIgnorados
    );

    @Query("""
        SELECT c FROM Cita c
        WHERE c.idStaff = :idStaff
        AND c.estadoCita NOT IN :estadosIgnorados
        AND c.fechaHoraInicio < :fin
        AND c.fechaHoraFin > :inicio
    """)
    List<Cita> buscarCitasEnRango(
            UUID idStaff,
            OffsetDateTime inicio,
            OffsetDateTime fin,
            List<EstadoCita> estadosIgnorados
    );

    @Modifying
    @Query("""
        UPDATE Cita c
        SET c.estadoCita = :estadoExpirada,
            c.expiracionReserva = NULL
        WHERE c.estadoCita = :estadoPendiente
        AND c.expiracionReserva IS NOT NULL
        AND c.expiracionReserva <= :ahora
    """)
    int expirarReservasVencidas(
            EstadoCita estadoPendiente,
            EstadoCita estadoExpirada,
            OffsetDateTime ahora
    );
}
