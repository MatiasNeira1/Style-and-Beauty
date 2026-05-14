package com.style.beauty.ms_cliente.repository;

import com.style.beauty.ms_cliente.model.StaffModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface StaffRepository extends JpaRepository<StaffModel, UUID> {

}
