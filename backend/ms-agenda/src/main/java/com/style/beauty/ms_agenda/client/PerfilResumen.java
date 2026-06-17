package com.style.beauty.ms_agenda.client;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.UUID;

public record PerfilResumen(
        @JsonAlias({"idPersona", "id_persona", "idStaff", "id_staff", "id"})
        UUID idPersona,

        @JsonAlias({"idAuth", "id_auth"})
        String idAuth,

        String rut,

        String nombre,

        String apellidos,

        @JsonAlias({"emailContacto", "email_contacto", "email"})
        String emailContacto,

        @JsonAlias({"fotoUrl", "foto_url", "imageUrl", "imagenUrl"})
        String fotoUrl,

        @JsonAlias({"activo", "active"})
        Boolean activo,

        @JsonAlias({"holguraCitaMinutos", "holgura_cita_minutos", "holguraMinutos", "holgura_minutos"})
        Integer holguraCitaMinutos) {
}
