package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.ServicioResumen;
import org.springframework.stereotype.Service;
import com.style.beauty.ms_agenda.exception.BusinessException;


@Service
public class HolguraService {

    private static final int MINUTOS_ATENCION_MINIMA = 5;
    private static final int HOLGURA_EXTERNA_MINUTOS = 15;

    public int calcularHolguraMin(ServicioResumen servicio) {
        return calcularHolguraMin(servicio, null);
    }

    public int calcularHolguraMin(ServicioResumen servicio, Integer holguraStaffMinutos) {

        if (servicio == null) {
            throw new BusinessException("No se pudo obtener la información del servicio");
        }

        if (servicio.duracionMinutos() == null || servicio.duracionMinutos() <= 0) {
            throw new BusinessException("La duración del servicio debe estar configurada en ms-catalogo");
        }

        return ajustarHolguraSegura(servicio.duracionMinutos(), HOLGURA_EXTERNA_MINUTOS);
    }

    private int ajustarHolguraSegura(int duracion, int holgura) {
        if (holgura < duracion) {
            return holgura;
        }

        return Math.max(0, duracion - MINUTOS_ATENCION_MINIMA);
    }
}
