package com.style.beauty.ms_agenda.client;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.math.BigDecimal;
import java.util.UUID;

public record ServicioResumen(
       @JsonAlias({"id_servicio", "idServicio", "id"})
        UUID idServicio,

        String nombre,

        String categoria,

        @JsonAlias({"duracion_minutos", "duracionMinutos", "duracionServicioMin", "duracion"})
        Integer duracionMinutos,

        @JsonAlias({"holgura_minutos", "holguraMinutos", "holguraMin"})
        Integer holguraMinutos,

        @JsonAlias({"precio_total", "precioTotal", "precio", "price"})
        BigDecimal precioTotal
){
    public ServicioResumen(UUID idServicio, String nombre, String categoria, Integer duracionMinutos, Integer holguraMinutos) {
        this(idServicio, nombre, categoria, duracionMinutos, holguraMinutos, null);
    }
}
