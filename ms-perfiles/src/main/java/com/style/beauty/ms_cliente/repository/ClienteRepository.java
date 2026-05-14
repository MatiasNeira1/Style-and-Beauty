package com.style.beauty.ms_cliente.repository;

import com.style.beauty.ms_cliente.model.ClienteModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ClienteRepository extends JpaRepository<ClienteModel, UUID> {

}
