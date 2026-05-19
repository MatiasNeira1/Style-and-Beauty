package com.style.beauty.ms_extra.repository;

import com.style.beauty.ms_extra.entity.ChatExtraordinario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatExtraordinarioRepository extends JpaRepository<ChatExtraordinario, UUID> {

    List<ChatExtraordinario> findByIdCitaExtraordinariaOrderByFechaEnvioAsc(UUID idCitaExtraordinaria);

    void deleteByIdCitaExtraordinaria(UUID idCitaExtraordinaria);
}
