package com.style.beauty.ms_agenda.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record StaffProximasDisponiblesBatchRequest(
        @NotEmpty List<@NotNull UUID> idsStaff,
        LocalDate fechaDesde,
        Integer diasTrabajoRequeridos,
        Integer limiteDiasBusqueda,
        String zonaHoraria
) {
}
