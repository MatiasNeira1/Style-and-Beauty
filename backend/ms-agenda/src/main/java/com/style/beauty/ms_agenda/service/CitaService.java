package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CancelarCitaRequest;
import com.style.beauty.ms_agenda.dto.CitaAgendaResponse;
import com.style.beauty.ms_agenda.dto.ConfirmarPagoRequest;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadMensualResponse;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSemanalRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.dto.FinalizarCitaRequest;
import com.style.beauty.ms_agenda.dto.RechazarPagoRequest;
import com.style.beauty.ms_agenda.entity.BloqueoAgenda;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.entity.HistorialCita;
import com.style.beauty.ms_agenda.entity.JornadaStaff;
import com.style.beauty.ms_agenda.enums.AccionHistorial;
import com.style.beauty.ms_agenda.enums.EstadoCita;
import com.style.beauty.ms_agenda.enums.TipoCita;
import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
import com.style.beauty.ms_agenda.repository.BloqueoAgendaRepository;
import com.style.beauty.ms_agenda.repository.CitaRepository;
import com.style.beauty.ms_agenda.repository.HistorialCitaRepository;
import com.style.beauty.ms_agenda.repository.JornadaStaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CitaService {

    private final CitaRepository citaRepository;
    private final JornadaStaffRepository jornadaStaffRepository;
    private final BloqueoAgendaRepository bloqueoAgendaRepository;
    private final HistorialCitaRepository historialCitaRepository;
    private final PerfilClient perfilClient;
    private final ServicioClient servicioClient;
    private final HolguraService holguraService;
    private final GoogleCalendarService googleCalendarService;
    private final StaffCalendarConfigService staffCalendarConfigService;

    @Value("${app.agenda.zone:America/Santiago}")
    private String agendaZone;

    public List<Cita> listar() {
        return citaRepository.findAll();
    }

    public Cita buscarPorId(UUID id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));
    }

    public List<CitaAgendaResponse> listarPorStaff(UUID idStaff, LocalDate desde, LocalDate hasta, EstadoCita estado) {
        OffsetDateTime inicio = atDateTime(desde, 0, 0);
        OffsetDateTime fin = atDateTime(hasta.plusDays(1), 0, 0);
        return citaRepository.buscarCitasPorStaff(idStaff, inicio, fin, estado)
                .stream()
                .map(this::toAgendaResponse)
                .toList();
    }

    public List<CitaAgendaResponse> listarPorCliente(UUID idCliente, LocalDate desde, LocalDate hasta, EstadoCita estado) {
        OffsetDateTime inicio = atDateTime(desde, 0, 0);
        OffsetDateTime fin = atDateTime(hasta.plusDays(1), 0, 0);
        return citaRepository.buscarCitasPorCliente(idCliente, inicio, fin, estado)
                .stream()
                .map(this::toAgendaResponse)
                .toList();
    }

    public List<DisponibilidadSlot> calcularDisponibilidad(DisponibilidadRequest request) {

        // Solo valida que el staff exista.
        // Google Calendar NO se usa para bloquear disponibilidad.
        perfilClient.obtenerStaff(request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        validarStaffRealizaServicio(request.idServicio(), request.idStaff());

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio);

        validarDuracionYHolgura(duracion, holgura);

        return calcularDisponibilidadParaDia(request.idStaff(), request.fecha(), duracion, holgura);
    }

    public List<DisponibilidadMensualResponse> calcularDisponibilidadMensual(UUID idServicio, UUID idStaff, int anio, int mes) {
        if (mes < 1 || mes > 12) {
            throw new BusinessException("El mes debe estar entre 1 y 12");
        }

        // Valida dependencias una sola vez; el calculo diario se reutiliza para cada fecha.
        perfilClient.obtenerStaff(idStaff);

        ServicioResumen servicio = servicioClient.obtenerServicio(idServicio);
        validarStaffRealizaServicio(idServicio, idStaff);

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio);

        validarDuracionYHolgura(duracion, holgura);

        LocalDate inicioMes = LocalDate.of(anio, mes, 1);
        int diasDelMes = inicioMes.lengthOfMonth();
        List<DisponibilidadMensualResponse> disponibilidad = new ArrayList<>();

        for (int dia = 1; dia <= diasDelMes; dia++) {
            LocalDate fecha = inicioMes.withDayOfMonth(dia);
            List<DisponibilidadSlot> slots = calcularDisponibilidadParaDia(idStaff, fecha, duracion, holgura);
            disponibilidad.add(new DisponibilidadMensualResponse(fecha, slots));
        }

        return disponibilidad;
    }

    public List<DisponibilidadMensualResponse> calcularDisponibilidadSemanal(DisponibilidadSemanalRequest request) {
        // Valida dependencias una sola vez y reutiliza el mismo calculo diario de disponibilidad.
        perfilClient.obtenerStaff(request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        validarStaffRealizaServicio(request.idServicio(), request.idStaff());

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio);

        validarDuracionYHolgura(duracion, holgura);

        List<DisponibilidadMensualResponse> disponibilidad = new ArrayList<>();

        for (int offset = 0; offset < 7; offset++) {
            LocalDate fecha = request.fechaInicioSemana().plusDays(offset);
            List<DisponibilidadSlot> slots = calcularDisponibilidadParaDia(request.idStaff(), fecha, duracion, holgura);
            disponibilidad.add(new DisponibilidadMensualResponse(fecha, slots));
        }

        return disponibilidad;
    }

    private List<DisponibilidadSlot> calcularDisponibilidadParaDia(UUID idStaff, LocalDate fecha, int duracion, int holgura) {
        List<JornadaStaff> jornadas = jornadaStaffRepository
                .findByIdStaffAndDiaSemanaAndActivoTrue(
                        idStaff,
                        fecha.getDayOfWeek().getValue()
                );

        if (jornadas.isEmpty()) {
            return List.of();
        }

        OffsetDateTime inicioDia = atDateTime(fecha, 0, 0);
        OffsetDateTime finDia = inicioDia.plusDays(1);

        List<EstadoCita> ignorados = estadosIgnoradosParaDisponibilidad();

        List<Cita> citas = citaRepository.buscarCitasEnRango(
                idStaff,
                inicioDia,
                finDia,
                ignorados
        );

        List<BloqueoAgenda> bloqueos = bloqueoAgendaRepository.buscarBloqueosEnRango(
                idStaff,
                inicioDia,
                finDia
        );

        List<DisponibilidadSlot> slots = new ArrayList<>();

        for (JornadaStaff jornada : jornadas) {

            OffsetDateTime cursor = fecha
                    .atTime(jornada.getHoraInicio())
                    .atZone(zoneId())
                    .toOffsetDateTime();

            OffsetDateTime finJornada = fecha
                    .atTime(jornada.getHoraFin())
                    .atZone(zoneId())
                    .toOffsetDateTime();

            OffsetDateTime ahora = OffsetDateTime.now(zoneId());

            while (!cursor.plusMinutes(duracion).isAfter(finJornada)) {

                OffsetDateTime finVisible = cursor.plusMinutes(duracion);
                OffsetDateTime finAtencion = finVisible.minusMinutes(holgura);

                boolean disponible = !cursor.isBefore(ahora)
                        && !tieneChoque(cursor, finVisible, citas, bloqueos);

                if (disponible) {
                    slots.add(new DisponibilidadSlot(
                            cursor,
                            finVisible,
                            finAtencion,
                            duracion,
                            holgura
                    ));

                    cursor = finVisible;
                } else {
                    cursor = cursor.plusMinutes(15);
                }
            }
        }

        return slots.stream().distinct().toList();
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Cita crear(CrearCitaRequest request) {
        if (request.idCliente() == null) {
            throw new BusinessException("No fue posible identificar al cliente autenticado");
        }

        perfilClient.obtenerCliente(request.idCliente());
        perfilClient.obtenerStaff(request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        validarStaffRealizaServicio(request.idServicio(), request.idStaff());

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio);

        validarDuracionYHolgura(duracion, holgura);

        OffsetDateTime inicio = normalizarAZoneAgenda(request.fechaHoraInicio());
        OffsetDateTime finVisible = inicio.plusMinutes(duracion);
        OffsetDateTime finAtencion = finVisible.minusMinutes(holgura);

        validarJornada(request.idStaff(), inicio, finVisible);
        validarBloqueos(request.idStaff(), inicio, finVisible);
        validarChoqueCitas(request.idStaff(), inicio, finVisible);
        validarHorarioDisponible(request.idStaff(), inicio, finVisible, duracion, holgura);

        Cita cita = Cita.builder()
                .idCliente(request.idCliente())
                .idStaff(request.idStaff())
                .idServicio(request.idServicio())
                .fechaHoraInicio(inicio)
                .fechaHoraFin(finVisible)
                .fechaHoraFinAtencion(finAtencion)
                .duracionServicioMin(duracion)
                .holguraMin(holgura)
                .estadoCita(EstadoCita.PENDIENTE_PAGO)
                .tipoCita(TipoCita.NORMAL)
                .observacionCliente(request.observacionCliente())
                .build();

        Cita guardada = guardarSinSolape(cita);

        registrarHistorial(
                guardada.getIdCita(),
                AccionHistorial.CREADA,
                null,
                guardada.getEstadoCita().name(),
                "Cita creada pendiente de pago"
        );

        return guardada;
    }

    @Transactional
    public Cita actualizarEstado(UUID id, ActualizarEstadoCitaRequest request) {

        Cita cita = buscarPorId(id);

        EstadoCita estadoAnterior = cita.getEstadoCita();

        cita.setEstadoCita(request.estadoCita());
        cita.setObservacionStaff(request.observacionStaff());

        Cita actualizada = citaRepository.save(cita);

        if (request.estadoCita() == EstadoCita.CONFIRMADA) {
            actualizada = crearEventoGoogleCalendarSoloVisualizacion(actualizada);
        } else if (request.estadoCita() == EstadoCita.CANCELADA
                || request.estadoCita() == EstadoCita.RECHAZADA
                || request.estadoCita() == EstadoCita.EXPIRADA) {
            eliminarEventoGoogleCalendarSiExiste(actualizada);
            actualizada = citaRepository.save(actualizada);
        }

        registrarHistorial(
                id,
                AccionHistorial.MODIFICADA,
                estadoAnterior.name(),
                request.estadoCita().name(),
                "Cambio de estado de cita"
        );

        return actualizada;
    }

    @Transactional
    public Cita confirmarPago(UUID id, ConfirmarPagoRequest request) {
        Cita cita = buscarPorId(id);

        if (cita.getEstadoCita() == EstadoCita.CONFIRMADA) {
            if (request.idTransaccionPago() != null && cita.getIdTransaccionPago() == null) {
                cita.setIdTransaccionPago(request.idTransaccionPago());
            }
            Cita actualizada = citaRepository.save(cita);
            return crearEventoGoogleCalendarSoloVisualizacion(actualizada);
        }

        if (cita.getEstadoCita() != EstadoCita.PENDIENTE_PAGO) {
            throw new BusinessException("Solo se puede confirmar una cita pendiente de pago");
        }

        EstadoCita estadoAnterior = cita.getEstadoCita();
        cita.setEstadoCita(EstadoCita.CONFIRMADA);
        cita.setIdTransaccionPago(request.idTransaccionPago());

        Cita actualizada = citaRepository.save(cita);
        actualizada = crearEventoGoogleCalendarSoloVisualizacion(actualizada);

        registrarHistorial(
                id,
                AccionHistorial.PAGO_APROBADO,
                estadoAnterior.name(),
                EstadoCita.CONFIRMADA.name(),
                "Pago aprobado y cita confirmada"
        );

        return actualizada;
    }

    @Transactional
    public Cita rechazarPago(UUID id, RechazarPagoRequest request) {
        Cita cita = buscarPorId(id);

        if (cita.getEstadoCita() == EstadoCita.RECHAZADA || cita.getEstadoCita() == EstadoCita.EXPIRADA) {
            return cita;
        }

        if (cita.getEstadoCita() == EstadoCita.FINALIZADA) {
            throw new BusinessException("No se puede rechazar una cita finalizada");
        }

        EstadoCita estadoAnterior = cita.getEstadoCita();
        cita.setEstadoCita(EstadoCita.RECHAZADA);
        cita.setObservacionStaff(defaultText(request.motivo(), "Pago Webpay rechazado"));
        eliminarEventoGoogleCalendarSiExiste(cita);

        Cita actualizada = citaRepository.save(cita);

        registrarHistorial(
                id,
                AccionHistorial.PAGO_RECHAZADO,
                estadoAnterior.name(),
                EstadoCita.RECHAZADA.name(),
                cita.getObservacionStaff()
        );

        return actualizada;
    }

    @Transactional
    public void cancelar(UUID id) {
        cancelar(id, new CancelarCitaRequest("Cita cancelada"));
    }

    @Transactional
    public Cita cancelar(UUID id, CancelarCitaRequest request) {

        Cita cita = buscarPorId(id);

        if (cita.getEstadoCita() == EstadoCita.FINALIZADA) {
            throw new BusinessException("No se puede cancelar una cita finalizada");
        }

        if (cita.getEstadoCita() == EstadoCita.CANCELADA
                || cita.getEstadoCita() == EstadoCita.RECHAZADA
                || cita.getEstadoCita() == EstadoCita.EXPIRADA) {
            return cita;
        }

        EstadoCita estadoAnterior = cita.getEstadoCita();

        cita.setEstadoCita(EstadoCita.CANCELADA);
        cita.setObservacionStaff(defaultText(request.motivo(), "Cita cancelada"));
        eliminarEventoGoogleCalendarSiExiste(cita);

        Cita actualizada = citaRepository.save(cita);

        registrarHistorial(
                id,
                AccionHistorial.CANCELADA,
                estadoAnterior.name(),
                EstadoCita.CANCELADA.name(),
                cita.getObservacionStaff()
        );

        return actualizada;
    }

    @Transactional
    public Cita finalizar(UUID id, FinalizarCitaRequest request) {
        Cita cita = buscarPorId(id);

        if (cita.getEstadoCita() == EstadoCita.FINALIZADA) {
            return cita;
        }

        if (cita.getEstadoCita() != EstadoCita.CONFIRMADA) {
            throw new BusinessException("Solo se puede finalizar una cita confirmada");
        }

        if (OffsetDateTime.now(zoneId()).isBefore(cita.getFechaHoraFinAtencion())) {
            throw new BusinessException("No se puede finalizar antes de la hora de termino de la atencion");
        }

        EstadoCita estadoAnterior = cita.getEstadoCita();
        cita.setEstadoCita(EstadoCita.FINALIZADA);
        cita.setObservacionStaff(defaultText(request.observacionStaff(), "Atencion finalizada correctamente"));

        Cita actualizada = citaRepository.save(cita);

        registrarHistorial(
                id,
                AccionHistorial.FINALIZADA,
                estadoAnterior.name(),
                EstadoCita.FINALIZADA.name(),
                cita.getObservacionStaff()
        );

        return actualizada;
    }

    private Cita crearEventoGoogleCalendarSoloVisualizacion(Cita cita) {
        if (cita.getGoogleCalendarEventId() != null) {
            return cita;
        }

        try {
            PerfilResumen cliente = perfilClient.obtenerCliente(cita.getIdCliente());
            PerfilResumen staff = perfilClient.obtenerStaff(cita.getIdStaff());
            ServicioResumen servicio = servicioClient.obtenerServicio(cita.getIdServicio());
            String calendarId = staffCalendarConfigService.buscarActivoPorStaff(cita.getIdStaff())
                    .map(config -> config.getCalendarId())
                    .orElse(null);

            String googleEventId = googleCalendarService.crearEvento(
                    cita,
                    cliente,
                    staff,
                    servicio,
                    calendarId
            );

            if (googleEventId != null) {
                cita.setGoogleCalendarEventId(googleEventId);
                return citaRepository.saveAndFlush(cita);
            }

        } catch (Exception e) {
            log.warn(
                    "No se pudo crear el evento en Google Calendar para la cita {}. La cita queda guardada igualmente.",
                    cita.getIdCita(),
                    e
            );
        }

        return cita;
    }

    private void eliminarEventoGoogleCalendarSiExiste(Cita cita) {
        if (cita.getGoogleCalendarEventId() == null) {
            return;
        }

        try {
            String calendarId = staffCalendarConfigService.buscarActivoPorStaff(cita.getIdStaff())
                    .map(config -> config.getCalendarId())
                    .orElse(null);
            googleCalendarService.eliminarEvento(calendarId, cita.getGoogleCalendarEventId());
            cita.setGoogleCalendarEventId(null);
        } catch (Exception e) {
            log.warn(
                    "No se pudo eliminar el evento de Google Calendar para la cita {}. La cita se actualiza igualmente.",
                    cita.getIdCita(),
                    e
            );
        }
    }

    private Cita guardarSinSolape(Cita cita) {
        try {
            return citaRepository.saveAndFlush(cita);
        } catch (DataIntegrityViolationException e) {
            throw new DataIntegrityViolationException(
                    "El horario seleccionado ya no esta disponible",
                    e
            );
        }
    }

    private int duracionServicio(ServicioResumen servicio) {

        if (servicio.duracionMinutos() == null || servicio.duracionMinutos() <= 0) {
            throw new BusinessException("La duración del servicio debe estar configurada en ms-catalogo");
        }

        return servicio.duracionMinutos();
    }

    private void validarDuracionYHolgura(int duracion, int holgura) {

        if (holgura < 0) {
            throw new BusinessException("La holgura no puede ser negativa");
        }

        if (holgura >= duracion) {
            throw new BusinessException("La holgura no puede ser igual o mayor a la duración del servicio");
        }
    }

    private void validarStaffRealizaServicio(UUID idServicio, UUID idStaff) {
        if (!servicioClient.staffRealizaServicio(idServicio, idStaff)) {
            throw new BusinessException("El profesional no realiza el servicio seleccionado");
        }
    }

    private void validarJornada(UUID idStaff, OffsetDateTime inicio, OffsetDateTime finVisible) {

        if (!inicio.toLocalDate().equals(finVisible.toLocalDate())) {
            throw new BusinessException("El horario debe caber dentro de la jornada del staff");
        }

        int diaSemana = inicio.getDayOfWeek().getValue();

        boolean dentroDeJornada = jornadaStaffRepository
                .findByIdStaffAndDiaSemanaAndActivoTrue(idStaff, diaSemana)
                .stream()
                .anyMatch(jornada -> !inicio.toLocalTime().isBefore(jornada.getHoraInicio())
                        && !finVisible.toLocalTime().isAfter(jornada.getHoraFin()));

        if (!dentroDeJornada) {
            throw new BusinessException("El horario solicitado no cumple la jornada del staff");
        }
    }

    private void validarBloqueos(UUID idStaff, OffsetDateTime inicio, OffsetDateTime finVisible) {

        boolean existeBloqueo = !bloqueoAgendaRepository
                .buscarBloqueosEnRango(idStaff, inicio, finVisible)
                .isEmpty();

        if (existeBloqueo) {
            throw new BusinessException("El horario solicitado no está disponible por un bloqueo de agenda");
        }
    }

    private void validarChoqueCitas(UUID idStaff, OffsetDateTime inicio, OffsetDateTime finVisible) {

        List<EstadoCita> ignorados = estadosIgnoradosParaDisponibilidad();

        boolean existeChoque = !citaRepository
                .buscarChoquesAgenda(idStaff, inicio, finVisible, ignorados)
                .isEmpty();

        if (existeChoque) {
            throw new BusinessException("El horario solicitado se solapa con otra cita");
        }
    }

    private void validarHorarioDisponible(
            UUID idStaff,
            OffsetDateTime inicio,
            OffsetDateTime finVisible,
            int duracion,
            int holgura
    ) {
        List<DisponibilidadSlot> slots = calcularDisponibilidadParaDia(
                idStaff,
                inicio.toLocalDate(),
                duracion,
                holgura
        );

        boolean existeSlot = slots.stream()
                .anyMatch(slot -> slot.inicio().isEqual(inicio)
                        && slot.finVisible().isEqual(finVisible));

        if (!existeSlot) {
            throw new BusinessException("El horario seleccionado ya no esta disponible");
        }
    }

    private boolean tieneChoque(
            OffsetDateTime inicio,
            OffsetDateTime finVisible,
            List<Cita> citas,
            List<BloqueoAgenda> bloqueos
    ) {
        boolean choqueCita = citas.stream()
                .anyMatch(cita -> haySolape(
                        cita.getFechaHoraInicio(),
                        cita.getFechaHoraFin(),
                        inicio,
                        finVisible
                ));

        boolean choqueBloqueo = bloqueos.stream()
                .anyMatch(bloqueo -> haySolape(
                        bloqueo.getFechaHoraInicio(),
                        bloqueo.getFechaHoraFin(),
                        inicio,
                        finVisible
                ));

        return choqueCita || choqueBloqueo;
    }

    private boolean haySolape(
            OffsetDateTime inicioExistente,
            OffsetDateTime finExistente,
            OffsetDateTime inicioNuevo,
            OffsetDateTime finNuevo
    ) {
        return inicioExistente.isBefore(finNuevo)
                && finExistente.isAfter(inicioNuevo);
    }

    private OffsetDateTime atDateTime(LocalDate date, int hour, int minute) {
        return date.atTime(hour, minute)
                .atZone(zoneId())
                .toOffsetDateTime();
    }

    private OffsetDateTime normalizarAZoneAgenda(OffsetDateTime fechaHora) {
        return fechaHora.atZoneSameInstant(zoneId()).toOffsetDateTime();
    }

    private ZoneId zoneId() {
        return ZoneId.of(agendaZone);
    }

    private List<EstadoCita> estadosIgnoradosParaDisponibilidad() {
        return List.of(
                EstadoCita.CANCELADA,
                EstadoCita.EXPIRADA,
                EstadoCita.RECHAZADA
        );
    }

    private CitaAgendaResponse toAgendaResponse(Cita cita) {
        String nombreCliente = null;
        String nombreServicio = null;

        try {
            PerfilResumen cliente = perfilClient.obtenerCliente(cita.getIdCliente());
            nombreCliente = nombreCompleto(cliente);
        } catch (Exception e) {
            log.debug("No se pudo obtener cliente {} para cita {}", cita.getIdCliente(), cita.getIdCita());
        }

        try {
            ServicioResumen servicio = servicioClient.obtenerServicio(cita.getIdServicio());
            nombreServicio = servicio.nombre();
        } catch (Exception e) {
            log.debug("No se pudo obtener servicio {} para cita {}", cita.getIdServicio(), cita.getIdCita());
        }

        return new CitaAgendaResponse(
                cita.getIdCita(),
                cita.getIdCliente(),
                nombreCliente,
                cita.getIdStaff(),
                cita.getIdServicio(),
                nombreServicio,
                cita.getFechaHoraInicio(),
                cita.getFechaHoraFin(),
                cita.getFechaHoraFinAtencion(),
                cita.getEstadoCita(),
                cita.getObservacionCliente(),
                cita.getObservacionStaff(),
                cita.getGoogleCalendarEventId()
        );
    }

    private String nombreCompleto(PerfilResumen perfil) {
        if (perfil == null) {
            return null;
        }
        return (defaultText(perfil.nombre(), "") + " " + defaultText(perfil.apellidos(), "")).trim();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private void registrarHistorial(
            UUID idCita,
            AccionHistorial accion,
            String estadoAnterior,
            String estadoNuevo,
            String descripcion
    ) {
        historialCitaRepository.save(
                HistorialCita.builder()
                        .idCita(idCita)
                        .accion(accion)
                        .estadoAnterior(estadoAnterior)
                        .estadoNuevo(estadoNuevo)
                        .descripcion(descripcion)
                        .build()
        );
    }
}
