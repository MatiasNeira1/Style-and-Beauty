package com.style.beauty.ms_agenda.dto;

import com.style.beauty.ms_agenda.enums.EstadoCita;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CrearCitasLoteResponse(
        UUID idCliente,
        LocalDate fecha,
        Integer totalServicios,
        Integer tiempoTotalMin,
        BigDecimal totalEstimado,
        BigDecimal abono,
        BigDecimal saldoPendiente,
        List<ReservaLoteCreadaResponse> reservas
) {
    public CrearCitasLoteResponse(
            UUID idCliente,
            LocalDate fecha,
            Integer totalServicios,
            Integer tiempoTotalMin,
            List<ReservaLoteCreadaResponse> reservas
    ) {
        this(idCliente, fecha, totalServicios, tiempoTotalMin, null, null, null, reservas);
    }

    public record ReservaLoteCreadaResponse(
            UUID idCita,
            UUID idServicio,
            UUID idStaff,
            OffsetDateTime fechaHoraInicio,
            OffsetDateTime fechaHoraFin,
            OffsetDateTime fechaHoraFinAtencion,
            Integer duracionServicioMin,
            Integer holguraMin,
            EstadoCita estadoCita,
            OffsetDateTime expiracionReserva
    ) {
    }
}
