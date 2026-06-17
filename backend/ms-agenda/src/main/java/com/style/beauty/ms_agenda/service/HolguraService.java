package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.ServicioResumen;
import org.springframework.stereotype.Service;
import com.style.beauty.ms_agenda.exception.BusinessException;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;


@Service
public class HolguraService {

    private static final int MINUTOS_ATENCION_MINIMA = 5;
    private static final int HOLGURA_FALLBACK_MINUTOS = 15;
    private static final Map<String, Integer> HOLGURA_POR_CATEGORIA = Map.of(
            "cabello", 30,
            "maquillaje", 15,
            "nails", 15,
            "piel", 20,
            "spa", 30
    );

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

        Integer holguraConfigurada = servicio.holguraMinutos() != null
                ? servicio.holguraMinutos()
                : holguraStaffMinutos != null
                    ? holguraStaffMinutos
                    : holguraPorCategoria(servicio.categoria());

        if (holguraConfigurada == null) {
            holguraConfigurada = HOLGURA_FALLBACK_MINUTOS;
        }

        if (holguraConfigurada < 0) {
            throw new BusinessException("La holgura del servicio no puede ser negativa");
        }

        return ajustarHolguraSegura(servicio.duracionMinutos(), holguraConfigurada);
    }

    private Integer holguraPorCategoria(String categoria) {
        String normalizada = normalizarCategoria(categoria);

        if (normalizada == null) {
            return null;
        }

        if (normalizada.contains("cabello") || normalizada.contains("peluqueria")) {
            return HOLGURA_POR_CATEGORIA.get("cabello");
        }

        if (normalizada.contains("maquillaje")) {
            return HOLGURA_POR_CATEGORIA.get("maquillaje");
        }

        if (normalizada.contains("nails") || normalizada.contains("manicure") || normalizada.contains("unas")) {
            return HOLGURA_POR_CATEGORIA.get("nails");
        }

        if (normalizada.contains("piel") || normalizada.contains("facial")) {
            return HOLGURA_POR_CATEGORIA.get("piel");
        }

        if (normalizada.contains("spa")) {
            return HOLGURA_POR_CATEGORIA.get("spa");
        }

        return null;
    }

    private String normalizarCategoria(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            return null;
        }

        String sinAcentos = Normalizer.normalize(categoria.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos.toLowerCase(Locale.ROOT);
    }

    private int ajustarHolguraSegura(int duracion, int holgura) {
        if (holgura < duracion) {
            return holgura;
        }

        return Math.max(0, duracion - MINUTOS_ATENCION_MINIMA);
    }
}
