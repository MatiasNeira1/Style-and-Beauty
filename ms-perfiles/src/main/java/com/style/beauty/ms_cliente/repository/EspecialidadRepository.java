package com.style.beauty.ms_cliente.repository;
import com.style.beauty.ms_cliente.model.EspecialidadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface EspecialidadRepository extends JpaRepository<EspecialidadModel, UUID> {

}
