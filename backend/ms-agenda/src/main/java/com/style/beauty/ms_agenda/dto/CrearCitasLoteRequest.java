package com.style.beauty.ms_agenda.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record CrearCitasLoteRequest(
        @NotNull UUID idCliente,
        @NotNull LocalDate fecha,
        BigDecimal abono,
        @NotEmpty List<@Valid ReservaLoteRequest> reservas
) {
    public CrearCitasLoteRequest(
            UUID idCliente,
            LocalDate fecha,
            List<@Valid ReservaLoteRequest> reservas
    ) {
        this(idCliente, fecha, null, reservas);
    }

    public record ReservaLoteRequest(
            @NotNull UUID idServicio,
            @NotNull UUID idStaff,
            @NotNull LocalTime horaInicio,
            String notaInterna,
            String observacionCliente
    ) {
        public String nota() {
            if (notaInterna != null && !notaInterna.isBlank()) {
                return notaInterna.trim();
            }
            return observacionCliente == null ? null : observacionCliente.trim();
        }
    }
}
