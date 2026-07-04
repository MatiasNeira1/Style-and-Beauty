package com.style.beauty.ms_agenda.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DisponibilidadStaffRequest(
        @NotNull UUID idServicio,
        @NotNull LocalDate fecha,
        @NotEmpty List<@NotNull UUID> idsStaff,
        Integer duracionServicioMin,
        @JsonAlias({"idCliente", "clientId"})
        UUID idCliente
) {
}
