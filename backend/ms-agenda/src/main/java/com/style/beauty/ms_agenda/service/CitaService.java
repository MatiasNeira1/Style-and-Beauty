package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
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

    @Value("${app.agenda.zone:America/Santiago}")
    private String agendaZone;

    public List<Cita> listar() {
        return citaRepository.findAll();
    }

    public Cita buscarPorId(UUID id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));
    }

    public List<DisponibilidadSlot> calcularDisponibilidad(DisponibilidadRequest request) {

        // Solo valida que el staff exista.
        // Google Calendar NO se usa para bloquear disponibilidad.
        perfilClient.obtenerStaff(request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio);

        validarDuracionYHolgura(duracion, holgura);

        List<JornadaStaff> jornadas = jornadaStaffRepository
                .findByIdStaffAndDiaSemanaAndActivoTrue(
                        request.idStaff(),
                        request.fecha().getDayOfWeek().getValue()
                );

        if (jornadas.isEmpty()) {
            return List.of();
        }

        OffsetDateTime inicioDia = atDateTime(request.fecha(), 0, 0);
        OffsetDateTime finDia = inicioDia.plusDays(1);

        List<EstadoCita> ignorados = estadosIgnoradosParaDisponibilidad();

        List<Cita> citas = citaRepository.buscarCitasEnRango(
                request.idStaff(),
                inicioDia,
                finDia,
                ignorados
        );

        List<BloqueoAgenda> bloqueos = bloqueoAgendaRepository.buscarBloqueosEnRango(
                request.idStaff(),
                inicioDia,
                finDia
        );

        List<DisponibilidadSlot> slots = new ArrayList<>();

        for (JornadaStaff jornada : jornadas) {

            OffsetDateTime cursor = request.fecha()
                    .atTime(jornada.getHoraInicio())
                    .atZone(zoneId())
                    .toOffsetDateTime();

            OffsetDateTime finJornada = request.fecha()
                    .atTime(jornada.getHoraFin())
                    .atZone(zoneId())
                    .toOffsetDateTime();

            OffsetDateTime ahora = OffsetDateTime.now(zoneId());

            while (!cursor.plusMinutes(duracion).isAfter(finJornada)) {

                OffsetDateTime finVisible = cursor.plusMinutes(duracion);
                OffsetDateTime finAtencion = finVisible.minusMinutes(holgura);

                if (!cursor.isBefore(ahora)
                        && !tieneChoque(cursor, finVisible, citas, bloqueos)) {

                    slots.add(new DisponibilidadSlot(
                            cursor,
                            finVisible,
                            finAtencion,
                            duracion,
                            holgura
                    ));
                }

                cursor = cursor.plusMinutes(15);
            }
        }

        return slots;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Cita crear(CrearCitaRequest request) {
        if (request.idCliente() == null) {
            throw new BusinessException("No fue posible identificar al cliente autenticado");
        }

        PerfilResumen cliente = perfilClient.obtenerCliente(request.idCliente());
        PerfilResumen staff = perfilClient.obtenerStaff(request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio);

        validarDuracionYHolgura(duracion, holgura);

        OffsetDateTime inicio = request.fechaHoraInicio();
        OffsetDateTime finVisible = inicio.plusMinutes(duracion);
        OffsetDateTime finAtencion = finVisible.minusMinutes(holgura);

        validarJornada(request.idStaff(), inicio, finVisible);
        validarBloqueos(request.idStaff(), inicio, finVisible);
        validarChoqueCitas(request.idStaff(), inicio, finVisible);

        Cita cita = Cita.builder()
                .idCliente(request.idCliente())
                .idStaff(request.idStaff())
                .idServicio(request.idServicio())
                .fechaHoraInicio(inicio)
                .fechaHoraFin(finVisible)
                .fechaHoraFinAtencion(finAtencion)
                .duracionServicioMin(duracion)
                .holguraMin(holgura)
                .estadoCita(EstadoCita.CONFIRMADA)
                .tipoCita(TipoCita.NORMAL)
                .observacionCliente(request.observacionCliente())
                .build();

        Cita guardada = guardarSinSolape(cita);

        guardada = crearEventoGoogleCalendarSoloVisualizacion(
                guardada,
                cliente,
                staff,
                servicio
        );

        registrarHistorial(
                guardada.getIdCita(),
                AccionHistorial.CREADA,
                null,
                guardada.getEstadoCita().name(),
                "Cita creada y confirmada"
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
    public void cancelar(UUID id) {

        Cita cita = buscarPorId(id);

        EstadoCita estadoAnterior = cita.getEstadoCita();

        cita.setEstadoCita(EstadoCita.CANCELADA);

        citaRepository.save(cita);

        registrarHistorial(
                id,
                AccionHistorial.CANCELADA,
                estadoAnterior.name(),
                EstadoCita.CANCELADA.name(),
                "Cita cancelada"
        );
    }

    private Cita crearEventoGoogleCalendarSoloVisualizacion(
            Cita cita,
            PerfilResumen cliente,
            PerfilResumen staff,
            ServicioResumen servicio
    ) {
        try {
            String googleEventId = googleCalendarService.crearEvento(
                    cita,
                    cliente,
                    staff,
                    servicio
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