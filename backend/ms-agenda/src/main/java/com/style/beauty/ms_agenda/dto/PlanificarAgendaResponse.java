package com.style.beauty.ms_agenda.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PlanificarAgendaResponse(
        UUID idCliente,
        LocalDate fecha,
        Integer totalPlanes,
        List<PlanAgenda> planes,
        List<String> advertencias
) {
    public record PlanAgenda(
            Integer indice,
            OffsetDateTime horaInicio,
            OffsetDateTime horaFinAtencion,
            OffsetDateTime bloqueadoHasta,
            Integer atencionTotalMin,
            Integer holguraExternaMin,
            Integer tiempoBloqueadoTotalMin,
            BigDecimal totalEstimado,
            List<ServicioPlanificado> servicios
    ) {
    }

    public record ServicioPlanificado(
            Integer orden,
            UUID idServicio,
            String servicioNombre,
            UUID idStaff,
            String profesionalNombre,
            OffsetDateTime horaInicio,
            OffsetDateTime horaFinAtencion,
            OffsetDateTime bloqueadoHasta,
            Integer duracionServicioMin,
            Integer holguraMin,
            Integer esperaDesdeAnteriorMin
    ) {
    }
}
