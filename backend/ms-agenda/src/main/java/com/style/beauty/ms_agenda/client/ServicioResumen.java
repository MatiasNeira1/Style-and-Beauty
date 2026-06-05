package com.style.beauty.ms_agenda.client;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.UUID;

public record ServicioResumen(
       @JsonAlias({"id_servicio", "idServicio", "id"})
        UUID idServicio,

        String nombre,

        String categoria,

        @JsonAlias({"duracion_minutos", "duracionMinutos", "duracionServicioMin", "duracion"})
        Integer duracionMinutos,

        @JsonAlias({"holgura_minutos", "holguraMinutos", "holguraMin"})
        Integer holguraMinutos
){
}
