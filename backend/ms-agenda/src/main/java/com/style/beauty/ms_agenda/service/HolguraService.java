package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.ServicioResumen;
import org.springframework.stereotype.Service;
import com.style.beauty.ms_agenda.exception.BusinessException;


@Service
public class HolguraService {

    public int calcularHolguraMin(ServicioResumen servicio) {

        if (servicio == null) {
            throw new BusinessException("No se pudo obtener la información del servicio");
        }

        if (servicio.holguraMinutos() == null) {
            throw new BusinessException("La holgura del servicio debe estar configurada en ms-catalogo");
        }

        if (servicio.holguraMinutos() < 0) {
            throw new BusinessException("La holgura del servicio no puede ser negativa");
        }

        return servicio.holguraMinutos();
    }
}
