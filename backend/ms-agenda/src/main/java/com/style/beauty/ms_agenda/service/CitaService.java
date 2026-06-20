package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CitaAgendaResponse;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadMensualResponse;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSemanalRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.dto.ProximaCitaClienteResponse;
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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CitaService {
    private static final int DEFAULT_RESERVA_EXPIRACION_MINUTOS = 15;
    private static final int DEFAULT_HOLGURA_MINUTOS = 15;
    private static final BigDecimal ABONO_RESERVA_CLP = BigDecimal.valueOf(10_000);
    private static final int SABADO_HORA_CIERRE = 16;
    private static final String MSG_FECHA_PASADA = "No puedes reservar fechas anteriores a hoy.";
    private static final String MSG_DOMINGO = "No atendemos los domingos.";
    private static final String MSG_SABADO_16 = "Los sábados atendemos solo hasta las 16:00.";
    private static final String MSG_CLIENTE_SOLAPE = "Ya tienes una cita en ese horario. Elige el horario consecutivo disponible.";
    private static final String MSG_CADENA = "Para reservar otro servicio el mismo dia debes elegir el horario consecutivo disponible.";

    private final CitaRepository citaRepository;
    private final JornadaStaffRepository jornadaStaffRepository;
    private final BloqueoAgendaRepository bloqueoAgendaRepository;
    private final HistorialCitaRepository historialCitaRepository;
    private final PerfilClient perfilClient;
    private final ServicioClient servicioClient;
    private final HolguraService holguraService;

    @Value("${app.agenda.zone:America/Santiago}")
    private String agendaZone;

    @Value("${app.reserva.expiracion-minutos:${APP_RESERVA_EXPIRACION_MINUTOS:15}}")
    private int minutosReservaTemporal = DEFAULT_RESERVA_EXPIRACION_MINUTOS;

    @Value("${app.agenda.max-dias-anticipacion:${APP_AGENDA_MAX_DIAS_ANTICIPACION:30}}")
    private int maxDiasAnticipacion = 30;

    public List<Cita> listar() {
        log.info("Listando citas en ms-agenda");
        liberarReservasVencidas();
        return citaRepository.findAll();
    }

    public List<Cita> listarPorStaff(UUID idStaff) {
        log.info("Listando citas en ms-agenda para staff: idStaff={}", idStaff);
        liberarReservasVencidas();
        return citaRepository.findByIdStaff(idStaff);
    }

    public List<CitaAgendaResponse> listarAgendaStaff(UUID idStaff) {
        log.info("Listando agenda enriquecida para staff: idStaff={}", idStaff);
        liberarReservasVencidas();

        Map<UUID, String> nombresClientes = new HashMap<>();
        Map<UUID, String> nombresServicios = new HashMap<>();

        return citaRepository.findByIdStaff(idStaff)
                .stream()
                .sorted(Comparator.comparing(Cita::getFechaHoraInicio))
                .map(cita -> toAgendaResponse(cita, nombresClientes, nombresServicios))
                .toList();
    }

    public List<CitaAgendaResponse> listarPorCliente(UUID idCliente, LocalDate desde, LocalDate hasta, EstadoCita estado) {
        validarRangoFechas(desde, hasta);
        OffsetDateTime inicio = atDateTime(desde, 0, 0);
        OffsetDateTime fin = atDateTime(hasta.plusDays(1), 0, 0);

        Map<UUID, String> nombresClientes = new HashMap<>();
        Map<UUID, String> nombresServicios = new HashMap<>();

        return citaRepository.buscarCitasPorCliente(idCliente, inicio, fin, estado)
                .stream()
                .map(cita -> toAgendaResponse(cita, nombresClientes, nombresServicios))
                .toList();
    }

    public List<CitaAgendaResponse> listarPorStaff(UUID idStaff, LocalDate desde, LocalDate hasta, EstadoCita estado) {
        validarRangoFechas(desde, hasta);
        OffsetDateTime inicio = atDateTime(desde, 0, 0);
        OffsetDateTime fin = atDateTime(hasta.plusDays(1), 0, 0);

        Map<UUID, String> nombresClientes = new HashMap<>();
        Map<UUID, String> nombresServicios = new HashMap<>();

        return citaRepository.buscarCitasPorStaff(idStaff, inicio, fin, estado)
                .stream()
                .map(cita -> toAgendaResponse(cita, nombresClientes, nombresServicios))
                .toList();
    }

    public Cita buscarPorId(UUID id) {
        log.info("Buscando cita en ms-agenda: id={}", id);
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));
    }

    public List<ProximaCitaClienteResponse> listarProximasCliente(UUID idCliente) {
        if (idCliente == null) {
            throw new BusinessException("No fue posible identificar al cliente autenticado");
        }

        liberarReservasVencidas();
        return citaRepository.buscarProximasCitasCliente(
                        idCliente,
                        OffsetDateTime.now(zoneId()),
                        estadosIgnoradosParaDisponibilidad()
                )
                .stream()
                .map(this::toProximaCitaClienteResponse)
                .toList();
    }

    public List<DisponibilidadSlot> calcularDisponibilidad(DisponibilidadRequest request) {
        log.info("Calculando disponibilidad: idServicio={}, idStaff={}, fecha={}",
                request.idServicio(), request.idStaff(), request.fecha());

        log.info("Liberando reservas vencidas antes de calcular disponibilidad");
        liberarReservasVencidas();
        validarFechaReservable(request.fecha());

        // Solo valida que el staff exista.
        // Google Calendar NO se usa para bloquear disponibilidad.
        var staff = perfilClient.obtenerStaff(request.idStaff());
        log.info("Staff encontrado para disponibilidad: idStaff={}", request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        log.info("Servicio encontrado para disponibilidad: idServicio={}, duracionMinutos={}, holguraMinutos={}, categoria={}",
                request.idServicio(), servicio.duracionMinutos(), servicio.holguraMinutos(), servicio.categoria());

        validarStaffRealizaServicio(request.idServicio(), request.idStaff());
        log.info("Servicio encontrado y staff validado: idServicio={}, idStaff={}",
                request.idServicio(), request.idStaff());

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio, staff.holguraCitaMinutos());

        validarDuracionYHolgura(duracion, holgura);

        List<DisponibilidadSlot> slots = calcularDisponibilidadParaDia(
                request.idStaff(),
                request.fecha(),
                duracion,
                holgura,
                request.idCliente()
        );
        log.info("Disponibilidad calculada: idServicio={}, idStaff={}, fecha={}, slots={}",
                request.idServicio(), request.idStaff(), request.fecha(), slots.size());
        return slots;
    }

    public List<DisponibilidadMensualResponse> calcularDisponibilidadMensual(UUID idServicio, UUID idStaff, int anio, int mes) {
        log.info("Calculando disponibilidad mensual: idServicio={}, idStaff={}, anio={}, mes={}",
                idServicio, idStaff, anio, mes);

        log.info("Liberando reservas vencidas antes de calcular disponibilidad mensual");
        liberarReservasVencidas();

        if (mes < 1 || mes > 12) {
            throw new BusinessException("El mes debe estar entre 1 y 12");
        }

        // Valida dependencias una sola vez; el calculo diario se reutiliza para cada fecha.
        var staff = perfilClient.obtenerStaff(idStaff);
        log.info("Staff encontrado para disponibilidad mensual: idStaff={}", idStaff);

        ServicioResumen servicio = servicioClient.obtenerServicio(idServicio);
        log.info("Servicio encontrado para disponibilidad mensual: idServicio={}, duracionMinutos={}, holguraMinutos={}, categoria={}",
                idServicio, servicio.duracionMinutos(), servicio.holguraMinutos(), servicio.categoria());

        validarStaffRealizaServicio(idServicio, idStaff);
        log.info("Servicio encontrado y staff validado para disponibilidad mensual: idServicio={}, idStaff={}",
                idServicio, idStaff);

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio, staff.holguraCitaMinutos());

        validarDuracionYHolgura(duracion, holgura);

        LocalDate inicioMes = LocalDate.of(anio, mes, 1);
        LocalDate hoy = fechaActualAgenda();
        LocalDate maxFecha = fechaMaximaReserva();
        if (inicioMes.isAfter(maxFecha) || inicioMes.withDayOfMonth(inicioMes.lengthOfMonth()).isBefore(hoy)) {
            throw new BusinessException("La disponibilidad solo puede consultarse entre hoy y los proximos " + maxDiasAnticipacion + " dias");
        }
        int diasDelMes = inicioMes.lengthOfMonth();
        List<DisponibilidadMensualResponse> disponibilidad = new ArrayList<>();

        for (int dia = 1; dia <= diasDelMes; dia++) {
            LocalDate fecha = inicioMes.withDayOfMonth(dia);
            List<DisponibilidadSlot> slots = fechaDisponibleParaListado(fecha)
                    ? calcularDisponibilidadParaDia(idStaff, fecha, duracion, holgura, null)
                    : List.of();
            disponibilidad.add(new DisponibilidadMensualResponse(fecha, slots));
        }

        return disponibilidad;
    }

    public List<DisponibilidadMensualResponse> calcularDisponibilidadSemanal(DisponibilidadSemanalRequest request) {
        log.info("Calculando disponibilidad semanal: idServicio={}, idStaff={}, fechaInicioSemana={}",
                request.idServicio(), request.idStaff(), request.fechaInicioSemana());

        log.info("Liberando reservas vencidas antes de calcular disponibilidad semanal");
        liberarReservasVencidas();
        validarSemanaReservable(request.fechaInicioSemana());

        // Valida dependencias una sola vez y reutiliza el mismo calculo diario de disponibilidad.
        var staff = perfilClient.obtenerStaff(request.idStaff());
        log.info("Staff encontrado para disponibilidad semanal: idStaff={}", request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        log.info("Servicio encontrado para disponibilidad semanal: idServicio={}, duracionMinutos={}, holguraMinutos={}, categoria={}",
                request.idServicio(), servicio.duracionMinutos(), servicio.holguraMinutos(), servicio.categoria());

        validarStaffRealizaServicio(request.idServicio(), request.idStaff());
        log.info("Servicio encontrado y staff validado para disponibilidad semanal: idServicio={}, idStaff={}",
                request.idServicio(), request.idStaff());

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio, staff.holguraCitaMinutos());

        validarDuracionYHolgura(duracion, holgura);

        List<DisponibilidadMensualResponse> disponibilidad = new ArrayList<>();

        for (int offset = 0; offset < 7; offset++) {
            LocalDate fecha = request.fechaInicioSemana().plusDays(offset);
            List<DisponibilidadSlot> slots = fechaDisponibleParaListado(fecha)
                    ? calcularDisponibilidadParaDia(request.idStaff(), fecha, duracion, holgura, request.idCliente())
                    : List.of();
            disponibilidad.add(new DisponibilidadMensualResponse(fecha, slots));
        }

        return disponibilidad;
    }

    private List<DisponibilidadSlot> calcularDisponibilidadParaDia(
            UUID idStaff,
            LocalDate fecha,
            int duracion,
            int holgura,
            UUID idCliente
    ) {
        log.info("Calculando slots para dia: idStaff={}, fecha={}, duracion={}, holgura={}",
                idStaff, fecha, duracion, holgura);

        List<JornadaStaff> jornadas = jornadaStaffRepository
                .findByIdStaffAndDiaSemanaAndActivoTrue(
                        idStaff,
                        fecha.getDayOfWeek().getValue()
                );

        if (jornadas.isEmpty()) {
            log.info("Sin jornadas activas para disponibilidad: idStaff={}, fecha={}, diaSemana={}",
                    idStaff, fecha, fecha.getDayOfWeek().getValue());
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

        log.info("Datos base disponibilidad: idStaff={}, fecha={}, jornadas={}, citas={}, bloqueos={}",
                idStaff, fecha, jornadas.size(), citas.size(), bloqueos.size());

        Optional<OffsetDateTime> inicioCadena = proximoInicioCadenaCliente(idCliente, fecha);
        if (inicioCadena.isPresent()) {
            List<DisponibilidadSlot> slotConsecutivo = slotConsecutivoCliente(
                    fecha,
                    duracion,
                    holgura,
                    jornadas,
                    citas,
                    bloqueos,
                    inicioCadena.get()
            );
            log.info("Slot consecutivo calculado para cliente: idStaff={}, fecha={}, slots={}",
                    idStaff, fecha, slotConsecutivo.size());
            return slotConsecutivo;
        }

        List<DisponibilidadSlot> slots = new ArrayList<>();

        for (JornadaStaff jornada : jornadas) {

            OffsetDateTime cursor = fecha
                    .atTime(jornada.getHoraInicio())
                    .atZone(zoneId())
                    .toOffsetDateTime();

            OffsetDateTime finJornada = finJornadaReservable(fecha, jornada);

            OffsetDateTime ahora = OffsetDateTime.now(zoneId());

            while (!cursor.plusMinutes(duracion).plusMinutes(holgura).isAfter(finJornada)) {

                OffsetDateTime finAtencion = cursor.plusMinutes(duracion);
                OffsetDateTime finVisible = finAtencion.plusMinutes(holgura);

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

        log.info("Slots calculados para dia: idStaff={}, fecha={}, slots={}",
                idStaff, fecha, slots.size());
        return slots.stream().distinct().toList();
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Cita crear(CrearCitaRequest request) {
        log.info("Creando cita: idServicio={}, idStaff={}, idCliente={}, fechaHoraInicio={}",
                request.idServicio(), request.idStaff(), request.idCliente(), request.fechaHoraInicio());

        liberarReservasVencidas();

        if (request.idCliente() == null) {
            throw new BusinessException("No fue posible identificar al cliente autenticado");
        }

        perfilClient.obtenerCliente(request.idCliente());
        var staff = perfilClient.obtenerStaff(request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        validarStaffRealizaServicio(request.idServicio(), request.idStaff());

        int duracion = duracionServicio(servicio);
        int holgura = holguraService.calcularHolguraMin(servicio, staff.holguraCitaMinutos());

        validarDuracionYHolgura(duracion, holgura);

        OffsetDateTime inicio = normalizarAZoneAgenda(request.fechaHoraInicio());
        OffsetDateTime finAtencion = inicio.plusMinutes(duracion);
        OffsetDateTime finVisible = finAtencion.plusMinutes(holgura);
        OffsetDateTime expiracionReserva = OffsetDateTime.now(zoneId()).plusMinutes(minutosReservaTemporal);

        validarFechaReservable(inicio.toLocalDate());
        validarFechaHoraReservable(inicio, finVisible);
        validarJornada(request.idStaff(), inicio, finVisible);
        validarBloqueos(request.idStaff(), inicio, finVisible);
        validarChoqueCitas(request.idStaff(), inicio, finVisible);
        validarChoqueCliente(request.idCliente(), inicio, finVisible);
        validarCadenaConsecutivaCliente(request.idCliente(), inicio);
        validarHorarioDisponible(request.idStaff(), request.idCliente(), inicio, finVisible, duracion, holgura);

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
                .expiracionReserva(expiracionReserva)
                .observacionCliente(request.observacionCliente())
                .build();

        Cita guardada = guardarSinSolape(cita);
        refrescarExpiracionReservasPendientesCliente(guardada.getIdCliente(), expiracionReserva);

        registrarHistorial(
                guardada.getIdCita(),
                AccionHistorial.CREADA,
                null,
                guardada.getEstadoCita().name(),
                "Reserva temporal agregada al carrito. Expira en " + minutosReservaTemporal + " minutos"
        );

        return guardada;
    }

    @Transactional
    public Cita actualizarEstado(UUID id, ActualizarEstadoCitaRequest request) {
        log.info("Actualizando estado de cita: id={}, estado={}", id, request.estadoCita());

        Cita cita = buscarPorId(id);

        EstadoCita estadoAnterior = cita.getEstadoCita();

        cita.setEstadoCita(request.estadoCita());
        if (request.idTransaccionPago() != null) {
            cita.setIdTransaccionPago(request.idTransaccionPago());
        }
        cita.setObservacionStaff(request.observacionStaff());
        if (request.estadoCita() != EstadoCita.PENDIENTE_PAGO) {
            cita.setExpiracionReserva(null);
        }

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
    public Cita finalizarCitaStaff(UUID id, UUID idStaff) {
        log.info("Finalizando cita desde panel staff: id={}, idStaff={}", id, idStaff);

        Cita cita = buscarPorId(id);
        if (!Objects.equals(cita.getIdStaff(), idStaff)) {
            throw new BusinessException("No puedes finalizar una cita asignada a otro profesional.");
        }

        if (cita.getEstadoCita() == EstadoCita.CANCELADA
                || cita.getEstadoCita() == EstadoCita.EXPIRADA
                || cita.getEstadoCita() == EstadoCita.RECHAZADA) {
            throw new BusinessException("Solo puedes finalizar citas activas o confirmadas.");
        }

        EstadoCita estadoAnterior = cita.getEstadoCita();
        cita.setEstadoCita(EstadoCita.FINALIZADA);
        cita.setExpiracionReserva(null);
        cita.setObservacionStaff("Cita finalizada por staff.");

        Cita actualizada = citaRepository.save(cita);

        registrarHistorial(
                id,
                AccionHistorial.FINALIZADA,
                estadoAnterior.name(),
                EstadoCita.FINALIZADA.name(),
                "Cita finalizada por staff"
        );

        return actualizada;
    }

    @Transactional
    public void cancelar(UUID id) {
        log.info("Cancelando cita: id={}", id);

        Cita cita = buscarPorId(id);

        EstadoCita estadoAnterior = cita.getEstadoCita();

        cita.setEstadoCita(EstadoCita.CANCELADA);
        cita.setExpiracionReserva(null);

        citaRepository.save(cita);

        registrarHistorial(
                id,
                AccionHistorial.CANCELADA,
                estadoAnterior.name(),
                EstadoCita.CANCELADA.name(),
                "Cita cancelada"
        );
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void liberarReservasVencidasProgramado() {
        liberarReservasVencidas();
    }

    @Transactional
    public void liberarReservasVencidas() {
        try {
            int reservasExpiradas = citaRepository.expirarReservasVencidas(
                    EstadoCita.PENDIENTE_PAGO,
                    EstadoCita.EXPIRADA,
                    OffsetDateTime.now(zoneId())
            );

            if (reservasExpiradas > 0) {
                log.info("Reservas vencidas expiradas: cantidad={}", reservasExpiradas);
            }
        } catch (RuntimeException ex) {
            log.error("Error completo liberando reservas vencidas", ex);
            throw ex;
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
            throw new BusinessException("El profesional ya tiene una cita en ese horario. Elige otra hora.");
        }
    }

    private void validarChoqueCliente(UUID idCliente, OffsetDateTime inicio, OffsetDateTime finVisible) {

        List<EstadoCita> ignorados = estadosIgnoradosParaDisponibilidad();

        boolean existeChoque = !citaRepository
                .buscarChoquesCliente(idCliente, inicio, finVisible, ignorados)
                .isEmpty();

        if (existeChoque) {
            throw new BusinessException(MSG_CLIENTE_SOLAPE);
        }
    }

    private void validarHorarioDisponible(
            UUID idStaff,
            UUID idCliente,
            OffsetDateTime inicio,
            OffsetDateTime finVisible,
            int duracion,
            int holgura
    ) {
        List<DisponibilidadSlot> slots = calcularDisponibilidadParaDia(
                idStaff,
                inicio.toLocalDate(),
                duracion,
                holgura,
                idCliente
        );

        boolean existeSlot = slots.stream()
                .anyMatch(slot -> slot.inicio().isEqual(inicio)
                        && slot.finVisible().isEqual(finVisible));

        if (!existeSlot) {
            throw new BusinessException("El horario seleccionado ya no esta disponible");
        }
    }

    private List<DisponibilidadSlot> slotConsecutivoCliente(
            LocalDate fecha,
            int duracion,
            int holgura,
            List<JornadaStaff> jornadas,
            List<Cita> citas,
            List<BloqueoAgenda> bloqueos,
            OffsetDateTime inicioRequerido
    ) {
        OffsetDateTime inicio = normalizarAZoneAgenda(inicioRequerido);
        OffsetDateTime finAtencion = inicio.plusMinutes(duracion);
        OffsetDateTime finVisible = finAtencion.plusMinutes(holgura);

        if (!inicio.toLocalDate().equals(fecha)) {
            return List.of();
        }

        if (inicio.isBefore(OffsetDateTime.now(zoneId()))) {
            return List.of();
        }

        if (!dentroDeJornadaReservable(fecha, inicio, finVisible, jornadas)) {
            return List.of();
        }

        if (tieneChoque(inicio, finVisible, citas, bloqueos)) {
            return List.of();
        }

        return List.of(new DisponibilidadSlot(
                inicio,
                finVisible,
                finAtencion,
                duracion,
                holgura
        ));
    }

    private void validarCadenaConsecutivaCliente(UUID idCliente, OffsetDateTime inicio) {
        Optional<OffsetDateTime> proximoInicio = proximoInicioCadenaCliente(idCliente, inicio.toLocalDate());
        if (proximoInicio.isEmpty()) {
            return;
        }

        if (!inicio.isEqual(proximoInicio.get())) {
            throw new BusinessException(MSG_CADENA);
        }
    }

    private Optional<OffsetDateTime> proximoInicioCadenaCliente(UUID idCliente, LocalDate fecha) {
        List<Cita> citasCliente = citasClienteDelDia(idCliente, fecha);
        return citasCliente.stream()
                .max(Comparator.comparing(this::finBloqueoCliente))
                .map(this::finBloqueoCliente);
    }

    private List<Cita> citasClienteDelDia(UUID idCliente, LocalDate fecha) {
        if (idCliente == null) {
            return List.of();
        }

        OffsetDateTime inicioDia = atDateTime(fecha, 0, 0);
        OffsetDateTime finDia = inicioDia.plusDays(1);
        return citaRepository.buscarCitasClienteEnRango(
                idCliente,
                inicioDia,
                finDia,
                estadosIgnoradosParaDisponibilidad()
        );
    }

    private OffsetDateTime finBloqueoCliente(Cita cita) {
        int holgura = cita.getHolguraMin() == null ? DEFAULT_HOLGURA_MINUTOS : Math.max(0, cita.getHolguraMin());
        if (cita.getFechaHoraFinAtencion() != null) {
            return cita.getFechaHoraFinAtencion().plusMinutes(holgura);
        }
        return cita.getFechaHoraFin();
    }

    private boolean dentroDeJornadaReservable(
            LocalDate fecha,
            OffsetDateTime inicio,
            OffsetDateTime finVisible,
            List<JornadaStaff> jornadas
    ) {
        return jornadas.stream()
                .anyMatch(jornada -> !inicio.isBefore(inicioJornada(fecha, jornada))
                        && !finVisible.isAfter(finJornadaReservable(fecha, jornada)));
    }

    private OffsetDateTime inicioJornada(LocalDate fecha, JornadaStaff jornada) {
        return fecha
                .atTime(jornada.getHoraInicio())
                .atZone(zoneId())
                .toOffsetDateTime();
    }

    private OffsetDateTime finJornadaReservable(LocalDate fecha, JornadaStaff jornada) {
        OffsetDateTime finJornada = fecha
                .atTime(jornada.getHoraFin())
                .atZone(zoneId())
                .toOffsetDateTime();

        if (fecha.getDayOfWeek() == DayOfWeek.SATURDAY) {
            OffsetDateTime cierreSabado = fecha
                    .atTime(SABADO_HORA_CIERRE, 0)
                    .atZone(zoneId())
                    .toOffsetDateTime();
            if (finJornada.isAfter(cierreSabado)) {
                return cierreSabado;
            }
        }

        return finJornada;
    }

    private void refrescarExpiracionReservasPendientesCliente(UUID idCliente, OffsetDateTime expiracionReserva) {
        if (idCliente == null || expiracionReserva == null) {
            return;
        }

        int actualizadas = citaRepository.actualizarExpiracionReservasPendientesCliente(
                idCliente,
                EstadoCita.PENDIENTE_PAGO,
                expiracionReserva
        );
        log.info("Expiracion de reservas pendientes refrescada: idCliente={}, reservas={}", idCliente, actualizadas);
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

    private LocalDate fechaActualAgenda() {
        return LocalDate.now(zoneId());
    }

    private LocalDate fechaMaximaReserva() {
        return fechaActualAgenda().plusDays(maxDiasAnticipacion);
    }

    private boolean fechaDentroRangoReservable(LocalDate fecha) {
        return !fecha.isBefore(fechaActualAgenda()) && !fecha.isAfter(fechaMaximaReserva());
    }

    private boolean fechaDisponibleParaListado(LocalDate fecha) {
        return fechaDentroRangoReservable(fecha) && fecha.getDayOfWeek() != DayOfWeek.SUNDAY;
    }

    private void validarFechaReservable(LocalDate fecha) {
        if (fecha.isBefore(fechaActualAgenda())) {
            throw new BusinessException(MSG_FECHA_PASADA);
        }

        if (fecha.isAfter(fechaMaximaReserva())) {
            throw new BusinessException("Solo puedes reservar hasta " + maxDiasAnticipacion + " días de anticipación.");
        }

        if (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw new BusinessException(MSG_DOMINGO);
        }
    }

    private void validarFechaHoraReservable(OffsetDateTime inicio, OffsetDateTime finVisible) {
        if (inicio.getDayOfWeek() == DayOfWeek.SATURDAY
                && finVisible.toLocalTime().isAfter(java.time.LocalTime.of(SABADO_HORA_CIERRE, 0))) {
            throw new BusinessException(MSG_SABADO_16);
        }
    }

    private void validarSemanaReservable(LocalDate fechaInicioSemana) {
        LocalDate finSemana = fechaInicioSemana.plusDays(6);
        if (finSemana.isBefore(fechaActualAgenda()) || fechaInicioSemana.isAfter(fechaMaximaReserva())) {
            throw new BusinessException("La disponibilidad solo puede consultarse entre hoy y los proximos " + maxDiasAnticipacion + " dias");
        }
    }

    private void validarRangoFechas(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null) {
            throw new BusinessException("Debe indicar fecha desde y hasta");
        }

        if (hasta.isBefore(desde)) {
            throw new BusinessException("La fecha hasta no puede ser anterior a la fecha desde");
        }
    }

    private CitaAgendaResponse toAgendaResponse(
            Cita cita,
            Map<UUID, String> nombresClientes,
            Map<UUID, String> nombresServicios
    ) {
        return new CitaAgendaResponse(
                cita.getIdCita(),
                cita.getIdCliente(),
                nombreCliente(cita.getIdCliente(), nombresClientes),
                cita.getIdStaff(),
                cita.getIdServicio(),
                nombreServicio(cita.getIdServicio(), nombresServicios),
                cita.getFechaHoraInicio(),
                cita.getFechaHoraFin(),
                cita.getFechaHoraFinAtencion(),
                cita.getEstadoCita(),
                cita.getObservacionCliente(),
                cita.getObservacionStaff(),
                cita.getGoogleCalendarEventId()
        );
    }

    private String nombreCliente(UUID idCliente, Map<UUID, String> nombresClientes) {
        if (idCliente == null) {
            return null;
        }
        return nombresClientes.computeIfAbsent(idCliente, this::obtenerNombreClienteSeguro);
    }

    private String nombreServicio(UUID idServicio, Map<UUID, String> nombresServicios) {
        if (idServicio == null) {
            return null;
        }
        return nombresServicios.computeIfAbsent(idServicio, this::obtenerNombreServicioSeguro);
    }

    private String obtenerNombreClienteSeguro(UUID idCliente) {
        try {
            var cliente = perfilClient.obtenerCliente(idCliente);
            return nombreCompleto(cliente.nombre(), cliente.apellidos());
        } catch (RuntimeException ex) {
            log.warn("No se pudo obtener nombre de cliente para agenda: idCliente={}", idCliente, ex);
            return null;
        }
    }

    private String obtenerNombreServicioSeguro(UUID idServicio) {
        try {
            return servicioClient.obtenerServicio(idServicio).nombre();
        } catch (RuntimeException ex) {
            log.warn("No se pudo obtener nombre de servicio para agenda: idServicio={}", idServicio, ex);
            return null;
        }
    }

    private String nombreCompleto(String nombre, String apellidos) {
        String nombreSeguro = nombre == null ? "" : nombre.trim();
        String apellidosSeguro = apellidos == null ? "" : apellidos.trim();
        String completo = (nombreSeguro + " " + apellidosSeguro).trim();
        return completo.isBlank() ? null : completo;
    }

    private List<EstadoCita> estadosIgnoradosParaDisponibilidad() {
        return List.of(
                EstadoCita.CANCELADA,
                EstadoCita.EXPIRADA,
                EstadoCita.RECHAZADA
        );
    }

    private ProximaCitaClienteResponse toProximaCitaClienteResponse(Cita cita) {
        ServicioResumen servicio = servicioClient.obtenerServicio(cita.getIdServicio());
        PerfilResumen staff = perfilClient.obtenerStaff(cita.getIdStaff());

        return new ProximaCitaClienteResponse(
                cita.getIdCita(),
                cita.getIdServicio(),
                servicio.nombre(),
                cita.getIdStaff(),
                nombreCompleto(staff),
                cita.getFechaHoraInicio(),
                cita.getFechaHoraFin(),
                cita.getFechaHoraFinAtencion(),
                cita.getDuracionServicioMin(),
                cita.getHolguraMin(),
                cita.getEstadoCita() == null ? null : cita.getEstadoCita().name(),
                servicio.precioTotal(),
                ABONO_RESERVA_CLP
        );
    }

    private String nombreCompleto(PerfilResumen perfil) {
        String nombre = perfil == null ? "" : String.valueOf(perfil.nombre() == null ? "" : perfil.nombre()).trim();
        String apellidos = perfil == null ? "" : String.valueOf(perfil.apellidos() == null ? "" : perfil.apellidos()).trim();
        String completo = (nombre + " " + apellidos).trim();
        if (!completo.isBlank()) {
            return completo;
        }
        return perfil == null || perfil.emailContacto() == null ? "Profesional" : perfil.emailContacto();
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
