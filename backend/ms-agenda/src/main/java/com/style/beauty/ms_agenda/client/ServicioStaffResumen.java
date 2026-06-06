package com.style.beauty.ms_agenda.client;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.UUID;

public record ServicioStaffResumen(
        @JsonAlias({"idServicio", "id_servicio"})
        UUID idServicio,

        @JsonAlias({"idStaff", "id_staff"})
        UUID idStaff,

        Boolean activo
) {
}
