package com.style.beauty.ms_agenda.dto;

import com.style.beauty.ms_agenda.enums.EstadoCita;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CrearCitasLoteResponse(
        UUID idCliente,
        LocalDate fecha,
        Integer totalServicios,
        Integer tiempoTotalMin,
        List<ReservaLoteCreadaResponse> reservas
) {
    public record ReservaLoteCreadaResponse(
            UUID idCita,
            UUID idServicio,
            UUID idStaff,
            OffsetDateTime fechaHoraInicio,
            OffsetDateTime fechaHoraFin,
            OffsetDateTime fechaHoraFinAtencion,
            Integer duracionServicioMin,
            Integer holguraMin,
            EstadoCita estadoCita
    ) {
    }
}
