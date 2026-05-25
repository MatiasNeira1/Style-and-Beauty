package com.style.beauty.ms_cliente.repository;

import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.style.beauty.ms_cliente.model.PersonaModel;

public interface PersonaRepository extends JpaRepository<PersonaModel, UUID> {
    //metodo para buscar por idAuth Firebase UID y por RUT
    Optional<PersonaModel> findByIdAuth(String idAuth);
    Optional<PersonaModel> findByRut(String rut);
    boolean existsByIdAuth(String idAuth);
    boolean existsByRutIgnoreCase(String rut);
    boolean existsByEmailContactoIgnoreCase(String emailContacto);

}
