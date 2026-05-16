package com.style.beauty.ms_cliente.strategy;

import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.model.PersonaModel;

public interface PerfilStrategy {

    String getTipoPerfil(); 
    PersonaModel crearPerfil(PerfilRequestDTO dto);
}
