package com.style.beauty.ms_agenda.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record PlanificarAgendaRequest(
        @JsonAlias({"idCliente", "clientId"})
        UUID idCliente,
        @NotNull LocalDate fecha,
        LocalTime horaInicial,
        Integer maxPlanes,
        @NotEmpty List<@Valid ServicioPlanRequest> servicios
) {
    public PlanificarAgendaRequest withCliente(UUID idCliente) {
        return new PlanificarAgendaRequest(idCliente, fecha, horaInicial, maxPlanes, servicios);
    }

    public record ServicioPlanRequest(
            @NotNull UUID idServicio,
            UUID idStaff,
            Integer duracionServicioMin
    ) {
    }
}
