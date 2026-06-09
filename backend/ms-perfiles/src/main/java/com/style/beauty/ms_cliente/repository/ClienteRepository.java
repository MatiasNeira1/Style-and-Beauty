package com.style.beauty.ms_cliente.repository;

import com.style.beauty.ms_cliente.model.ClienteModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ClienteRepository extends JpaRepository<ClienteModel, UUID> {

    @Query("select c from ClienteModel c order by c.fechaRegistro desc")
    List<ClienteModel> listarClientesRegistrados();
}
