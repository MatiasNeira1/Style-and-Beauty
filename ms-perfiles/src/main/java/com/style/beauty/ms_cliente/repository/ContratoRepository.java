package com.style.beauty.ms_cliente.repository;
import com.style.beauty.ms_cliente.model.ContratoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;


public interface ContratoRepository extends JpaRepository<ContratoModel, UUID> {

}
