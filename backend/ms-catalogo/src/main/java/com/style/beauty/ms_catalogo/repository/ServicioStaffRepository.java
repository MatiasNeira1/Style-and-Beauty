package com.style.beauty.ms_catalogo.repository;

import com.style.beauty.ms_catalogo.entity.ServicioStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServicioStaffRepository extends JpaRepository<ServicioStaff, UUID> {

    List<ServicioStaff> findByIdServicioAndActivoTrue(UUID idServicio);

    boolean existsByIdServicioAndIdStaffAndActivoTrue(UUID idServicio, UUID idStaff);

    Optional<ServicioStaff> findByIdServicioAndIdStaff(UUID idServicio, UUID idStaff);
}
