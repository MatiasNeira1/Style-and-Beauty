package com.style.beauty.ms_agenda.repository;

import com.style.beauty.ms_agenda.entity.JornadaStaff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JornadaStaffRepository extends JpaRepository<JornadaStaff, UUID> {
    List<JornadaStaff> findByIdStaffAndDiaSemanaAndActivoTrue(UUID idStaff, Integer diaSemana);

    List<JornadaStaff> findByIdStaff(UUID idStaff);

    void deleteByIdStaff(UUID idStaff);
}
