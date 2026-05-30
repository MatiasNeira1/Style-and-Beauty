package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.ServicioResumen;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;

@Service
public class HolguraService {

    public int calcularHolguraMin(ServicioResumen servicio) {
        if (servicio.holguraMinutos() != null && servicio.holguraMinutos() >= 0) {
            return servicio.holguraMinutos();
        }

        String nombre = normalizar(servicio.nombre());
        String categoria = normalizar(servicio.categoria());
        String texto = (nombre + " " + categoria).trim();

        if (esCabello(texto)) {
            return 30;
        }
        if (esSpaOMasaje(texto)) {
            return 30;
        }
        if (esCuidadoPiel(texto)) {
            return 20;
        }
        if (esMaquillaje(texto)) {
            return 15;
        }
        if (esNails(texto)) {
            return 15;
        }

        return 15;
    }

    private boolean esCabello(String texto) {
        return texto.contains("cabello")
                || texto.contains("peluqueria")
                || texto.contains("pelo")
                || texto.contains("capilar")
                || texto.contains("corte")
                || texto.contains("peinado")
                || texto.contains("mecha")
                || texto.contains("botox")
                || texto.contains("alisado")
                || texto.contains("tintura")
                || texto.contains("coloracion");
    }

    private boolean esMaquillaje(String texto) {
        return texto.contains("maquillaje");
    }

    private boolean esNails(String texto) {
        return texto.contains("nails")
                || texto.contains("unas")
                || texto.contains("uñas")
                || texto.contains("manicure")
                || texto.contains("manicura")
                || texto.contains("pedicure")
                || texto.contains("pedicura");
    }

    private boolean esCuidadoPiel(String texto) {
        return texto.contains("cuidado de la piel")
                || texto.contains("cuidados de la piel")
                || texto.contains("piel")
                || texto.contains("facial")
                || texto.contains("dermo")
                || texto.contains("limpieza facial")
                || texto.contains("estetica");
    }

    private boolean esSpaOMasaje(String texto) {
        return texto.contains("spa")
                || texto.contains("masaje")
                || texto.contains("masoterapia")
                || texto.contains("relajacion")
                || texto.contains("descontracturante");
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
