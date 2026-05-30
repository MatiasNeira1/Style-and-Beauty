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
        PerfilResumen staff = perfilClient.obtenerStaff(request.idStaff());
        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio);

        List<JornadaStaff> jornadas = jornadaStaffRepository
                .findByIdStaffAndDiaSemanaAndActivoTrue(request.idStaff(), request.fecha().getDayOfWeek().getValue());

        if (jornadas.isEmpty()) {
            return List.of();
        }

        OffsetDateTime inicioDia = atDateTime(request.fecha(), 0, 0);
        OffsetDateTime finDia = inicioDia.plusDays(1);
        List<EstadoCita> ignorados = estadosIgnoradosParaDisponibilidad();
        List<Cita> citas = citaRepository.buscarCitasEnRango(request.idStaff(), inicioDia, finDia, ignorados);
        List<BloqueoAgenda> bloqueos = bloqueoAgendaRepository.buscarBloqueosEnRango(request.idStaff(), inicioDia, finDia);
        List<GoogleCalendarService.CalendarBusyBlock> calendarBusyBlocks =
                googleCalendarService.obtenerBloquesOcupados(staff, inicioDia, finDia);
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

            while (!cursor.plusMinutes(duracion + holgura).isAfter(finJornada)) {
                OffsetDateTime finServicio = cursor.plusMinutes(duracion);
                OffsetDateTime finConHolgura = finServicio.plusMinutes(holgura);

                if (!cursor.isBefore(ahora) && !tieneChoque(cursor, finConHolgura, citas, bloqueos, calendarBusyBlocks)) {
                    slots.add(new DisponibilidadSlot(cursor, finServicio, finConHolgura));
                }

                cursor = cursor.plusMinutes(15);
            }
        }

        return slots;
    }

    private OffsetDateTime atDateTime(LocalDate date, int hour, int minute) {
        return date.atTime(hour, minute).atZone(zoneId()).toOffsetDateTime();
    }

    private ZoneId zoneId() {
        return ZoneId.of(agendaZone);
    }

    private boolean tieneChoque(
            OffsetDateTime inicio,
            OffsetDateTime finConHolgura,
            List<Cita> citas,
            List<BloqueoAgenda> bloqueos,
            List<GoogleCalendarService.CalendarBusyBlock> calendarBusyBlocks) {
        boolean choqueCita = citas.stream()
                .anyMatch(cita -> haySolape(cita.getFechaHoraInicio(), cita.getFechaHoraFinHolgura(), inicio, finConHolgura));

        boolean choqueBloqueo = bloqueos.stream()
                .anyMatch(bloqueo -> haySolapeConInicioReservado(bloqueo.getFechaHoraInicio(), bloqueo.getFechaHoraFin(), inicio, finConHolgura));

        boolean choqueCalendar = calendarBusyBlocks.stream()
                .anyMatch(block -> haySolapeConInicioReservado(block.inicio(), block.fin(), inicio, finConHolgura));

        return choqueCita || choqueBloqueo || choqueCalendar;
    }

    private boolean haySolape(
            OffsetDateTime inicioExistente,
            OffsetDateTime finExistente,
            OffsetDateTime inicioNuevo,
            OffsetDateTime finNuevo) {
        return inicioExistente.isBefore(finNuevo) && finExistente.isAfter(inicioNuevo);
    }

    private boolean haySolapeConInicioReservado(
            OffsetDateTime inicioExistente,
            OffsetDateTime finExistente,
            OffsetDateTime inicioNuevo,
            OffsetDateTime finNuevo) {
        return !inicioExistente.isAfter(finNuevo) && finExistente.isAfter(inicioNuevo);
    }

    private List<EstadoCita> estadosIgnoradosParaDisponibilidad() {
        return List.of(
                EstadoCita.CANCELADA,
                EstadoCita.EXPIRADA,
                EstadoCita.RECHAZADA);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Cita crear(CrearCitaRequest request) {
        PerfilResumen cliente = perfilClient.obtenerCliente(request.idCliente());
        PerfilResumen staff = perfilClient.obtenerStaff(request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio);

        OffsetDateTime inicio = request.fechaHoraInicio();
        OffsetDateTime fin = inicio.plusMinutes(duracion);
        OffsetDateTime finConHolgura = fin.plusMinutes(holgura);

        validarJornada(request.idStaff(), inicio, finConHolgura);
        validarBloqueos(request.idStaff(), inicio, finConHolgura);
        validarChoqueCitas(request.idStaff(), inicio, finConHolgura);
        validarBloqueosGoogleCalendar(staff, inicio, finConHolgura);

        Cita cita = Cita.builder()
                .idCliente(request.idCliente())
                .idStaff(request.idStaff())
                .idServicio(request.idServicio())
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .fechaHoraFinHolgura(finConHolgura)
                .duracionServicioMin(duracion)
                .holguraMin(holgura)
                .estadoCita(EstadoCita.PENDIENTE_PAGO)
                .tipoCita(TipoCita.NORMAL)
                .expiracionReserva(OffsetDateTime.now().plusMinutes(15))
                .observacionCliente(request.observacionCliente())
                .build();

        Cita guardada = guardarSinSolape(cita);

        String googleEventId = googleCalendarService.crearEvento(guardada, cliente, staff, servicio);
        if (googleEventId != null) {
            guardada.setGoogleCalendarEventId(googleEventId);
            guardada = citaRepository.saveAndFlush(guardada);
        }

        registrarHistorial(
                guardada.getIdCita(),
                AccionHistorial.CREADA,
                null,
                guardada.getEstadoCita().name(),
                "Cita creada en estado pendiente de pago");

        return guardada;
    }

    private int duracionServicio(ServicioResumen servicio) {
        if (servicio.duracionMinutos() == null || servicio.duracionMinutos() <= 0) {
            throw new BusinessException("La duracion del servicio debe estar configurada en ms-catalogo");
        }
        return servicio.duracionMinutos();
    }

    private Cita guardarSinSolape(Cita cita) {
        try {
            return citaRepository.saveAndFlush(cita);
        } catch (DataIntegrityViolationException e) {
            throw new DataIntegrityViolationException("El horario seleccionado ya no esta disponible. Elige otra hora.", e);
        }
    }

    private void validarBloqueosGoogleCalendar(PerfilResumen staff, OffsetDateTime inicio, OffsetDateTime finConHolgura) {
        boolean existeChoque = googleCalendarService.obtenerBloquesOcupados(staff, inicio, finConHolgura)
                .stream()
                .anyMatch(block -> haySolapeConInicioReservado(block.inicio(), block.fin(), inicio, finConHolgura));

        if (existeChoque) {
            throw new BusinessException("El horario solicitado se solapa con un evento de Google Calendar del staff");
        }
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
                "Cambio de estado de cita");

        return actualizada;
    }

    @Transactional
    public void cancelar(UUID id) {
        Cita cita = buscarPorId(id);
        EstadoCita anterior = cita.getEstadoCita();

        cita.setEstadoCita(EstadoCita.CANCELADA);
        citaRepository.save(cita);

        registrarHistorial(
                id,
                AccionHistorial.CANCELADA,
                anterior.name(),
                EstadoCita.CANCELADA.name(),
                "Cita cancelada");
    }

    private void validarJornada(UUID idStaff, OffsetDateTime inicio, OffsetDateTime finConHolgura) {
        if (!inicio.toLocalDate().equals(finConHolgura.toLocalDate())) {
            throw new BusinessException("El horario debe caber dentro de la jornada del staff incluyendo holgura");
        }

        int diaSemana = inicio.getDayOfWeek().getValue();

        boolean dentroDeJornada = jornadaStaffRepository
                .findByIdStaffAndDiaSemanaAndActivoTrue(idStaff, diaSemana)
                .stream()
                .anyMatch(j -> !inicio.toLocalTime().isBefore(j.getHoraInicio())
                        && !finConHolgura.toLocalTime().isAfter(j.getHoraFin()));

        if (!dentroDeJornada) {
            throw new BusinessException("El horario solicitado no cumple la jornada del staff incluyendo la holgura del servicio");
        }
    }

    private void validarBloqueos(UUID idStaff, OffsetDateTime inicio, OffsetDateTime finConHolgura) {
        boolean existeBloqueo = !bloqueoAgendaRepository
                .buscarBloqueosEnRango(idStaff, inicio, finConHolgura)
                .isEmpty();

        if (existeBloqueo) {
            throw new BusinessException("El horario solicitado no esta disponible por un bloqueo de agenda");
        }
    }

    private void validarChoqueCitas(UUID idStaff, OffsetDateTime inicio, OffsetDateTime finConHolgura) {
        List<EstadoCita> ignorados = estadosIgnoradosParaDisponibilidad();

        boolean existeChoque = !citaRepository
                .buscarChoquesAgenda(idStaff, inicio, finConHolgura, ignorados)
                .isEmpty();

        if (existeChoque) {
            throw new BusinessException("El horario solicitado se solapa con otra cita o su holgura operativa");
        }
    }

    private void registrarHistorial(
            UUID idCita,
            AccionHistorial accion,
            String estadoAnterior,
            String estadoNuevo,
            String descripcion) {
        historialCitaRepository.save(
                HistorialCita.builder()
                        .idCita(idCita)
                        .accion(accion)
                        .estadoAnterior(estadoAnterior)
                        .estadoNuevo(estadoNuevo)
                        .descripcion(descripcion)
                        .build());
    }
}
