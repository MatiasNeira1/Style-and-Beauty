package com.style.beauty.ms_cliente.repository;

import com.style.beauty.ms_cliente.dto.StaffPortfolioImageDTO;
import com.style.beauty.ms_cliente.model.StaffPortfolioImageModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface StaffPortfolioImageRepository extends JpaRepository<StaffPortfolioImageModel, UUID> {
    List<StaffPortfolioImageModel> findByStaff_IdPersonaOrderByCreatedAtDesc(UUID idStaff);

    @Query("""
            select new com.style.beauty.ms_cliente.dto.StaffPortfolioImageDTO(
                image.idFoto,
                image.urlFoto,
                image.nombreArchivo,
                image.createdAt
            )
            from StaffPortfolioImageModel image
            where image.staff.idPersona = :idStaff
            order by image.createdAt desc
            """)
    List<StaffPortfolioImageDTO> listarPortfolioLigero(@Param("idStaff") UUID idStaff);

    @Query("select count(distinct image.staff.idPersona) from StaffPortfolioImageModel image")
    long contarStaffConPortfolio();
}
