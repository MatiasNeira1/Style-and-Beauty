package com.style.beauty.ms_extra.dto;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record PropuestaStaffRequest(
        @NotNull OffsetDateTime fechaHoraPropuesta,
        String respuestaStaff,
        @NotNull Integer recargo) {
}