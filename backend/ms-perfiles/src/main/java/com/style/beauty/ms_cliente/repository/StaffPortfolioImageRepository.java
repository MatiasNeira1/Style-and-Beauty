package com.style.beauty.ms_cliente.repository;

import com.style.beauty.ms_cliente.model.StaffPortfolioImageModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StaffPortfolioImageRepository extends JpaRepository<StaffPortfolioImageModel, UUID> {
    List<StaffPortfolioImageModel> findByStaff_IdPersonaOrderByCreatedAtDesc(UUID idStaff);
}
