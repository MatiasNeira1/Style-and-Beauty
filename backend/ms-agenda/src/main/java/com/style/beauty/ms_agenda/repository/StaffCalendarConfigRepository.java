package com.style.beauty.ms_agenda.repository;

import com.style.beauty.ms_agenda.entity.StaffCalendarConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StaffCalendarConfigRepository extends JpaRepository<StaffCalendarConfig, UUID> {

    Optional<StaffCalendarConfig> findByIdStaff(UUID idStaff);

    Optional<StaffCalendarConfig> findByIdStaffAndActivoTrue(UUID idStaff);
}
