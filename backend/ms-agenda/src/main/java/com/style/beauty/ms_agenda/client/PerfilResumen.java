package com.style.beauty.ms_agenda.client;

import java.util.UUID;

public record PerfilResumen(
        UUID idPersona,
        String idAuth,
        String rut,
        String nombre,
        String apellidos,
        String emailContacto) {
}
