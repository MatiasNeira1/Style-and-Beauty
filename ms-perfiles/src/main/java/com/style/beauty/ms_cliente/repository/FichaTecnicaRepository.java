package com.style.beauty.ms_cliente.repository;
import com.style.beauty.ms_cliente.model.FichaTecnicaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface FichaTecnicaRepository extends JpaRepository<FichaTecnicaModel, UUID> {

}
