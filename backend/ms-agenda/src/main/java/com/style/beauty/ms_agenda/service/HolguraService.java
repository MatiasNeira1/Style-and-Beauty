package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.ServicioResumen;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;

@Service
public class HolguraService {

    public int calcularHolguraMin(ServicioResumen servicio) {
        String nombre = normalizar(servicio.nombre());
        String categoria = normalizar(servicio.categoria());
        String texto = (nombre + " " + categoria).trim();

        if (texto.contains("maquillaje") && texto.contains("novia")) {
            return 30;
        }
        if (texto.contains("mecha") || texto.contains("botox") || texto.contains("alisado")
                || texto.contains("tintura") || texto.contains("coloracion")) {
            return 30;
        }
        if (texto.contains("masaje")) {
            return 20;
        }
        if (texto.contains("manicure") || texto.contains("manicura")) {
            return 15;
        }
        if (texto.contains("maquillaje")) {
            return 15;
        }
        if (texto.contains("corte de pelo") || texto.contains("corte") || texto.contains("peinado")
                || texto.contains("hidratacion capilar") || texto.contains("hidratacion")) {
            return 10;
        }
        if (texto.contains("piel") || texto.contains("facial") || texto.contains("dermo")
                || texto.contains("limpieza facial") || texto.contains("estetica")
                || texto.contains("cuidado de la piel")) {
            return 10;
        }

        return 10;
    }

    private String normalizar(String value) {
        if (value == null) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }
}
