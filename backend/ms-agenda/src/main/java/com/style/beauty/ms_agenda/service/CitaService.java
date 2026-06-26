package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.client.ServicioStaffResumen;
import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CitaAgendaResponse;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.CrearCitasLoteRequest;
import com.style.beauty.ms_agenda.dto.CrearCitasLoteResponse;
import com.style.beauty.ms_agenda.dto.EvaluarCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadMensualResponse;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSemanalRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.dto.ProximaCitaClienteResponse;
import com.style.beauty.ms_agenda.dto.PlanificarAgendaRequest;
import com.style.beauty.ms_agenda.dto.PlanificarAgendaResponse;
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

import java.time.Duration;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CitaService {
    private static final int DEFAULT_RESERVA_EXPIRACION_MINUTOS = 15;
    private static final int DEFAULT_HOLGURA_MINUTOS = 15;
    private static final int HOLGURA_EXTERNA_MINUTOS = 15;
    private static final int MINUTOS_SEPARACION_TECNICA = 1;
    private static final int MAX_PLANES_DISPONIBILIDAD_MULTIPLE = 24;
    private static final int DEFAULT_PLANES_DISPONIBILIDAD_MULTIPLE = 8;
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

    public List<CitaAgendaResponse> listarCitasFinalizadasCliente(UUID idCliente) {
        log.info("Listando citas finalizadas para cliente: idCliente={}", idCliente);

        Map<UUID, String> nombresClientes = new HashMap<>();
        Map<UUID, String> nombresServicios = new HashMap<>();

        return citaRepository.findByIdClienteAndEstadoCita(idCliente, EstadoCita.FINALIZADA)
                .stream()
                .sorted(Comparator.comparing(Cita::getFechaHoraInicio).reversed())
                .map(cita -> toAgendaResponse(cita, nombresClientes, nombresServicios))
                .toList();
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

    public List<CitaAgendaResponse> listarPorCliente(
            UUID idCliente,
            LocalDate desde,
            LocalDate hasta,
            EstadoCita estado
    ) {
        log.info("Listando citas para cliente: idCliente={}, desde={}, hasta={}, estado={}",
                idCliente, desde, hasta, estado);
        validarRangoFechas(desde, hasta);
        liberarReservasVencidas();

        OffsetDateTime inicio = desde == null ? null : atDateTime(desde, 0, 0);
        OffsetDateTime fin = hasta == null ? null : atDateTime(hasta.plusDays(1), 0, 0);
        Map<UUID, String> nombresClientes = new HashMap<>();
        Map<UUID, String> nombresServicios = new HashMap<>();

        return citaRepository.buscarCitasPorCliente(idCliente, inicio, fin, estado)
                .stream()
                .map(cita -> toAgendaResponse(cita, nombresClientes, nombresServicios))
                .toList();
    }

    public List<CitaAgendaResponse> listarPorStaff(
            UUID idStaff,
            LocalDate desde,
            LocalDate hasta,
            EstadoCita estado
    ) {
        log.info("Listando citas para staff: idStaff={}, desde={}, hasta={}, estado={}",
                idStaff, desde, hasta, estado);
        validarRangoFechas(desde, hasta);
        liberarReservasVencidas();

        OffsetDateTime inicio = desde == null ? null : atDateTime(desde, 0, 0);
        OffsetDateTime fin = hasta == null ? null : atDateTime(hasta.plusDays(1), 0, 0);
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

    public List<ProximaCitaClienteResponse> listarHistorialCliente(UUID idCliente) {
        if (idCliente == null) {
            throw new BusinessException("No fue posible identificar al cliente autenticado");
        }

        liberarReservasVencidas();
        return citaRepository.buscarHistorialCitasCliente(idCliente, EstadoCita.FINALIZADA)
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
        validarStaffActivo(staff);
        log.info("Staff encontrado para disponibilidad: idStaff={}", request.idStaff());

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        log.info("Servicio encontrado para disponibilidad: idServicio={}, duracionMinutos={}, holguraMinutos={}, categoria={}",
                request.idServicio(), servicio.duracionMinutos(), servicio.holguraMinutos(), servicio.categoria());

        validarStaffRealizaServicio(request.idServicio(), request.idStaff());
        log.info("Servicio encontrado y staff validado: idServicio={}, idStaff={}",
                request.idServicio(), request.idStaff());

        int duracion = duracionServicio(servicio, request.duracionServicioMin(), true);
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
        validarStaffActivo(staff);
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
        validarStaffActivo(staff);
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

    public PlanificarAgendaResponse planificarAgendaMultiple(PlanificarAgendaRequest request) {
        log.info("Planificando agenda multiple: idCliente={}, fecha={}, horaInicial={}, servicios={}",
                request.idCliente(), request.fecha(), request.horaInicial(), request.servicios() == null ? 0 : request.servicios().size());

        liberarReservasVencidas();
        validarPlanificacionBase(request);
        if (request.idCliente() != null) {
            perfilClient.obtenerCliente(request.idCliente());
        }

        int limitePlanes = limitePlanes(request.maxPlanes());
        List<ServicioPlanEntrada> servicios = prepararServiciosPlan(request.servicios(), true);
        List<OffsetDateTime> inicios = request.horaInicial() == null
                ? generarIniciosPlan(servicios.get(0), request.fecha(), limitePlanes)
                : List.of(atDateTime(request.fecha(), request.horaInicial()));

        List<PlanificarAgendaResponse.PlanAgenda> planes = new ArrayList<>();
        List<String> advertencias = new ArrayList<>();

        for (OffsetDateTime inicio : inicios) {
            if (planes.size() >= limitePlanes) {
                break;
            }
            try {
                PlanificarAgendaResponse.PlanAgenda plan = construirPlanDinamico(
                        request.idCliente(),
                        request.fecha(),
                        inicio,
                        servicios,
                        planes.size() + 1
                );
                planes.add(plan);
            } catch (BusinessException ex) {
                if (advertencias.size() < 3) {
                    advertencias.add(ex.getMessage());
                }
            }
        }

        return new PlanificarAgendaResponse(
                request.idCliente(),
                request.fecha(),
                planes.size(),
                planes,
                advertencias.stream().distinct().toList()
        );
    }

    private PlanificarAgendaResponse.PlanAgenda planificarLoteExacto(
            CrearCitasLoteRequest request,
            boolean permiteDuracionAdmin
    ) {
        List<PlanificarAgendaRequest.ServicioPlanRequest> servicios = request.reservas().stream()
                .map(reserva -> new PlanificarAgendaRequest.ServicioPlanRequest(
                        reserva.idServicio(),
                        reserva.idStaff(),
                        permiteDuracionAdmin ? reserva.duracionServicioMin() : null
                ))
                .toList();

        PlanificarAgendaRequest planRequest = new PlanificarAgendaRequest(
                request.idCliente(),
                request.fecha(),
                request.reservas().get(0).horaInicio(),
                1,
                servicios
        );

        PlanificarAgendaResponse response = planificarAgendaMultiple(planRequest);
        PlanificarAgendaResponse.PlanAgenda plan = response.planes().stream()
                .findFirst()
                .orElseThrow(() -> new BusinessException(response.advertencias().isEmpty()
                        ? "No fue posible encadenar todos los servicios en esta fecha."
                        : response.advertencias().get(0)));

        for (int index = 0; index < request.reservas().size(); index += 1) {
            CrearCitasLoteRequest.ReservaLoteRequest reserva = request.reservas().get(index);
            PlanificarAgendaResponse.ServicioPlanificado servicio = plan.servicios().get(index);
            OffsetDateTime inicioSolicitado = request.fecha()
                    .atTime(reserva.horaInicio())
                    .atZone(zoneId())
                    .toOffsetDateTime();

            if (!Objects.equals(reserva.idServicio(), servicio.idServicio())
                    || !Objects.equals(reserva.idStaff(), servicio.idStaff())
                    || !servicio.horaInicio().isEqual(inicioSolicitado)) {
                throw new BusinessException("Los servicios deben usar la cadena dinamica disponible mas cercana al termino del servicio anterior.");
            }

            if (reserva.duracionServicioMin() != null
                    && permiteDuracionAdmin
                    && !Objects.equals(reserva.duracionServicioMin(), servicio.duracionServicioMin())) {
                throw new BusinessException("La duración seleccionada ya no coincide con el rango configurado del servicio.");
            }
        }

        return plan;
    }

    private void validarPlanificacionBase(PlanificarAgendaRequest request) {
        if (request.fecha() == null) {
            throw new BusinessException("Selecciona una fecha para planificar la agenda.");
        }
        validarFechaReservable(request.fecha());
        if (request.servicios() == null || request.servicios().size() < 2) {
            throw new BusinessException("Agrega al menos dos servicios para crear la agenda.");
        }
    }

    private int limitePlanes(Integer solicitado) {
        int limite = solicitado == null || solicitado <= 0 ? DEFAULT_PLANES_DISPONIBILIDAD_MULTIPLE : solicitado;
        return Math.min(limite, MAX_PLANES_DISPONIBILIDAD_MULTIPLE);
    }

    private List<ServicioPlanEntrada> prepararServiciosPlan(
            List<PlanificarAgendaRequest.ServicioPlanRequest> servicios,
            boolean permiteDuracionAdmin
    ) {
        Set<UUID> idsServicios = new HashSet<>();
        List<ServicioPlanEntrada> entradas = new ArrayList<>();

        for (PlanificarAgendaRequest.ServicioPlanRequest item : servicios) {
            if (item.idServicio() == null) {
                throw new BusinessException("El servicio es obligatorio para planificar la agenda.");
            }
            if (!idsServicios.add(item.idServicio())) {
                throw new BusinessException("La agenda múltiple requiere servicios distintos.");
            }

            ServicioResumen servicio = servicioClient.obtenerServicio(item.idServicio());
            int duracion = duracionServicio(servicio, item.duracionServicioMin(), permiteDuracionAdmin);
            entradas.add(new ServicioPlanEntrada(
                    item.idServicio(),
                    item.idStaff(),
                    servicio,
                    duracion,
                    precioServicio(servicio)
            ));
        }

        return entradas;
    }

    private List<OffsetDateTime> generarIniciosPlan(
            ServicioPlanEntrada primerServicio,
            LocalDate fecha,
            int limitePlanes
    ) {
        Set<OffsetDateTime> inicios = new HashSet<>();
        List<PerfilResumen> staffCompatibles = staffCompatibles(primerServicio);
        OffsetDateTime ahora = OffsetDateTime.now(zoneId());

        for (PerfilResumen staff : staffCompatibles) {
            List<JornadaStaff> jornadas = jornadaStaffRepository
                    .findByIdStaffAndDiaSemanaAndActivoTrue(staff.idPersona(), fecha.getDayOfWeek().getValue());
            for (JornadaStaff jornada : jornadas) {
                OffsetDateTime cursor = inicioJornada(fecha, jornada);
                OffsetDateTime finJornada = finJornadaReservable(fecha, jornada);
                while (!cursor.plusMinutes(primerServicio.duracion()).isAfter(finJornada)) {
                    if (!cursor.isBefore(ahora)) {
                        inicios.add(cursor);
                    }
                    cursor = cursor.plusMinutes(15);
                    if (inicios.size() >= limitePlanes * 8) {
                        break;
                    }
                }
            }
        }

        return inicios.stream()
                .sorted()
                .limit((long) limitePlanes * 8)
                .toList();
    }

    private PlanificarAgendaResponse.PlanAgenda construirPlanDinamico(
            UUID idCliente,
            LocalDate fecha,
            OffsetDateTime inicioDeseado,
            List<ServicioPlanEntrada> servicios,
            int indice
    ) {
        OffsetDateTime inicioNormalizado = normalizarAZoneAgenda(inicioDeseado);
        if (!inicioNormalizado.toLocalDate().equals(fecha)) {
            throw new BusinessException("La hora inicial debe pertenecer a la fecha seleccionada.");
        }

        List<PlanificarAgendaResponse.ServicioPlanificado> items = new ArrayList<>();
        List<BloquePlanificado> bloques = new ArrayList<>();
        OffsetDateTime finAtencionAnterior = null;
        BigDecimal totalEstimado = BigDecimal.ZERO;

        for (int index = 0; index < servicios.size(); index += 1) {
            ServicioPlanEntrada servicio = servicios.get(index);
            boolean ultimo = index == servicios.size() - 1;
            OffsetDateTime inicioMinimo = index == 0
                    ? inicioNormalizado
                    : finAtencionAnterior.plusMinutes(MINUTOS_SEPARACION_TECNICA);

            AsignacionPlan asignacion = buscarMejorAsignacion(
                    idCliente,
                    fecha,
                    servicio,
                    inicioMinimo,
                    index == 0,
                    ultimo,
                    bloques
            );

            int espera = index == 0
                    ? 0
                    : Math.max(0, (int) Duration.between(
                            finAtencionAnterior.plusMinutes(MINUTOS_SEPARACION_TECNICA),
                            asignacion.inicio()
                    ).toMinutes());
            int holguraServicio = ultimo ? HOLGURA_EXTERNA_MINUTOS : 0;
            totalEstimado = totalEstimado.add(servicio.precio());

            items.add(new PlanificarAgendaResponse.ServicioPlanificado(
                    index + 1,
                    servicio.idServicio(),
                    servicio.servicio().nombre(),
                    asignacion.staff().idPersona(),
                    nombreCompleto(asignacion.staff()),
                    asignacion.inicio(),
                    asignacion.finAtencion(),
                    asignacion.bloqueadoHasta(),
                    servicio.duracion(),
                    holguraServicio,
                    espera
            ));

            bloques.add(new BloquePlanificado(
                    asignacion.staff().idPersona(),
                    asignacion.inicio(),
                    asignacion.finAtencion(),
                    asignacion.bloqueadoHasta()
            ));
            finAtencionAnterior = asignacion.finAtencion();
        }

        OffsetDateTime inicioPlan = items.get(0).horaInicio();
        OffsetDateTime finAtencion = items.get(items.size() - 1).horaFinAtencion();
        OffsetDateTime bloqueadoHasta = items.get(items.size() - 1).bloqueadoHasta();
        int atencionTotal = items.stream().mapToInt(PlanificarAgendaResponse.ServicioPlanificado::duracionServicioMin).sum();
        int tiempoBloqueadoTotal = (int) Duration.between(inicioPlan, bloqueadoHasta).toMinutes();

        return new PlanificarAgendaResponse.PlanAgenda(
                indice,
                inicioPlan,
                finAtencion,
                bloqueadoHasta,
                atencionTotal,
                HOLGURA_EXTERNA_MINUTOS,
                tiempoBloqueadoTotal,
                totalEstimado,
                items
        );
    }

    private AsignacionPlan buscarMejorAsignacion(
            UUID idCliente,
            LocalDate fecha,
            ServicioPlanEntrada servicio,
            OffsetDateTime inicioMinimo,
            boolean inicioExacto,
            boolean ultimo,
            List<BloquePlanificado> bloques
    ) {
        return staffCompatibles(servicio).stream()
                .map(staff -> buscarPrimerInicioDisponible(
                        idCliente,
                        fecha,
                        servicio,
                        staff,
                        inicioMinimo,
                        inicioExacto,
                        ultimo,
                        bloques
                ))
                .flatMap(Optional::stream)
                .min(Comparator
                        .comparing(AsignacionPlan::inicio)
                        .thenComparing(asignacion -> asignacion.staff().idPersona().toString()))
                .orElseThrow(() -> new BusinessException("El servicio " + servicio.servicio().nombre() + " no tiene disponibilidad para continuar la agenda."));
    }

    private Optional<AsignacionPlan> buscarPrimerInicioDisponible(
            UUID idCliente,
            LocalDate fecha,
            ServicioPlanEntrada servicio,
            PerfilResumen staff,
            OffsetDateTime inicioMinimo,
            boolean inicioExacto,
            boolean ultimo,
            List<BloquePlanificado> bloques
    ) {
        OffsetDateTime inicioDia = atDateTime(fecha, 0, 0);
        OffsetDateTime finDia = inicioDia.plusDays(1);
        List<JornadaStaff> jornadas = jornadaStaffRepository
                .findByIdStaffAndDiaSemanaAndActivoTrue(staff.idPersona(), fecha.getDayOfWeek().getValue());
        if (jornadas.isEmpty()) {
            return Optional.empty();
        }

        List<Cita> citas = citaRepository.buscarCitasEnRango(
                staff.idPersona(),
                inicioDia,
                finDia,
                estadosIgnoradosParaDisponibilidad()
        );
        List<Cita> citasCliente = idCliente == null ? List.of() : citasClienteDelDia(idCliente, fecha);
        List<BloqueoAgenda> bloqueos = bloqueoAgendaRepository.buscarBloqueosEnRango(
                staff.idPersona(),
                inicioDia,
                finDia
        );

        OffsetDateTime cursor = normalizarAZoneAgenda(inicioMinimo);
        OffsetDateTime ahora = OffsetDateTime.now(zoneId());
        OffsetDateTime limite = jornadas.stream()
                .map(jornada -> finJornadaReservable(fecha, jornada))
                .max(Comparator.naturalOrder())
                .orElse(inicioDia);

        while (!cursor.isAfter(limite) && cursor.toLocalDate().equals(fecha)) {
            OffsetDateTime finAtencion = cursor.plusMinutes(servicio.duracion());
            OffsetDateTime bloqueadoHasta = finAtencion.plusMinutes(ultimo ? HOLGURA_EXTERNA_MINUTOS : 0);

            if (!cursor.isBefore(ahora)
                    && dentroDeJornadaReservable(fecha, cursor, finAtencion, jornadas)
                    && !tieneChoque(cursor, bloqueadoHasta, citas, bloqueos)
                    && !tieneChoqueBloquesStaff(staff.idPersona(), cursor, bloqueadoHasta, bloques)
                    && !tieneChoqueClienteAtencion(cursor, finAtencion, citasCliente)
                    && !tieneChoqueBloquesCliente(cursor, finAtencion, bloques)) {
                return Optional.of(new AsignacionPlan(staff, cursor, finAtencion, bloqueadoHasta));
            }

            if (inicioExacto) {
                return Optional.empty();
            }
            cursor = cursor.plusMinutes(1);
        }

        return Optional.empty();
    }

    private List<PerfilResumen> staffCompatibles(ServicioPlanEntrada servicio) {
        if (servicio.idStaffSolicitado() != null) {
            PerfilResumen staff = perfilClient.obtenerStaff(servicio.idStaffSolicitado());
            validarStaffActivo(staff);
            validarStaffRealizaServicio(servicio.idServicio(), staff.idPersona());
            return List.of(staff);
        }

        List<ServicioStaffResumen> relaciones = servicioClient.obtenerStaffPorServicio(servicio.idServicio());
        List<PerfilResumen> staff = relaciones.stream()
                .filter(relacion -> Boolean.TRUE.equals(relacion.activo()))
                .map(ServicioStaffResumen::idStaff)
                .filter(Objects::nonNull)
                .distinct()
                .map(perfilClient::obtenerStaff)
                .filter(perfil -> perfil.activo() == null || Boolean.TRUE.equals(perfil.activo()))
                .toList();

        if (staff.isEmpty()) {
            throw new BusinessException("No hay profesionales activos asociados al servicio " + servicio.servicio().nombre() + ".");
        }

        return staff;
    }

    private boolean tieneChoqueBloquesStaff(
            UUID idStaff,
            OffsetDateTime inicio,
            OffsetDateTime fin,
            List<BloquePlanificado> bloques
    ) {
        return bloques.stream()
                .filter(bloque -> Objects.equals(bloque.idStaff(), idStaff))
                .anyMatch(bloque -> haySolape(bloque.inicio(), bloque.bloqueadoHasta(), inicio, fin));
    }

    private boolean tieneChoqueBloquesCliente(
            OffsetDateTime inicio,
            OffsetDateTime finAtencion,
            List<BloquePlanificado> bloques
    ) {
        return bloques.stream()
                .anyMatch(bloque -> haySolape(bloque.inicio(), bloque.finAtencion(), inicio, finAtencion));
    }

    private boolean tieneChoqueClienteAtencion(
            OffsetDateTime inicio,
            OffsetDateTime finAtencion,
            List<Cita> citasCliente
    ) {
        return citasCliente.stream()
                .anyMatch(cita -> haySolape(
                        cita.getFechaHoraInicio(),
                        finAtencionCliente(cita),
                        inicio,
                        finAtencion
                ));
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

            while (!cursor.plusMinutes(duracion).isAfter(finJornada)) {

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
        return crearConReglas(request, EstadoCita.PENDIENTE_PAGO, true);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Cita crearDesdeAdmin(CrearCitaRequest request) {
        return crearConReglas(request, EstadoCita.CONFIRMADA, false);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public CrearCitasLoteResponse crearLoteDesdeAdmin(CrearCitasLoteRequest request) {
        log.info("Creando lote de citas admin: idCliente={}, fecha={}, reservas={}",
                request.idCliente(), request.fecha(), request.reservas() == null ? 0 : request.reservas().size());

        return crearLoteConReglas(request, EstadoCita.CONFIRMADA, false, true);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public CrearCitasLoteResponse crearLoteCliente(CrearCitasLoteRequest request) {
        log.info("Creando lote de citas cliente: idCliente={}, fecha={}, reservas={}",
                request.idCliente(), request.fecha(), request.reservas() == null ? 0 : request.reservas().size());

        return crearLoteConReglas(request, EstadoCita.PENDIENTE_PAGO, true, false);
    }

    private CrearCitasLoteResponse crearLoteConReglas(
            CrearCitasLoteRequest request,
            EstadoCita estadoInicial,
            boolean reservaTemporal,
            boolean permiteDuracionAdmin
    ) {
        liberarReservasVencidas();
        validarLoteBase(request);
        BigDecimal abono = permiteDuracionAdmin ? validarAbonoAdmin(request.abono()) : normalizarAbonoOpcional(request.abono());
        perfilClient.obtenerCliente(request.idCliente());

        PlanificarAgendaResponse.PlanAgenda plan = planificarLoteExacto(request, permiteDuracionAdmin);
        validarAbonoNoSupereTotal(abono, plan.totalEstimado());
        BigDecimal saldoPendiente = calcularSaldoPendiente(plan.totalEstimado(), abono);
        OffsetDateTime expiracionReserva = reservaTemporal
                ? OffsetDateTime.now(zoneId()).plusMinutes(minutosReservaTemporal)
                : null;

        List<Cita> preparadas = new ArrayList<>();
        for (int index = 0; index < plan.servicios().size(); index += 1) {
            PlanificarAgendaResponse.ServicioPlanificado servicioPlanificado = plan.servicios().get(index);
            CrearCitasLoteRequest.ReservaLoteRequest reserva = request.reservas().get(index);
            Cita cita = Cita.builder()
                    .idCliente(request.idCliente())
                    .idStaff(servicioPlanificado.idStaff())
                    .idServicio(servicioPlanificado.idServicio())
                    .fechaHoraInicio(servicioPlanificado.horaInicio())
                    .fechaHoraFin(servicioPlanificado.bloqueadoHasta())
                    .fechaHoraFinAtencion(servicioPlanificado.horaFinAtencion())
                    .duracionServicioMin(servicioPlanificado.duracionServicioMin())
                    .holguraMin(servicioPlanificado.holguraMin())
                    .estadoCita(estadoInicial)
                    .tipoCita(TipoCita.NORMAL)
                    .expiracionReserva(expiracionReserva)
                    .observacionCliente(notaLote(reserva))
                    .build();

            preparadas.add(cita);
        }

        List<Cita> guardadas = new ArrayList<>();
        for (Cita cita : preparadas) {
            cita.setMontoAbonado(abono);
            cita.setTotalEstimado(plan.totalEstimado());
            cita.setSaldoPendiente(saldoPendiente);
            Cita guardada = guardarSinSolape(cita);
            registrarHistorial(
                    guardada.getIdCita(),
                    AccionHistorial.CREADA,
                    null,
                    guardada.getEstadoCita().name(),
                    reservaTemporal
                            ? "Reserva temporal multiple agregada al carrito. Expira en " + minutosReservaTemporal + " minutos"
                            : "Reserva creada en agenda multiple desde panel administrativo"
            );
            guardadas.add(guardada);
        }

        if (reservaTemporal) {
            refrescarExpiracionReservasPendientesCliente(request.idCliente(), expiracionReserva);
        }

        return toLoteResponse(request.idCliente(), request.fecha(), plan.totalEstimado(), abono, saldoPendiente, guardadas);
    }

    private Cita crearConReglas(CrearCitaRequest request, EstadoCita estadoInicial, boolean reservaTemporal) {
        log.info("Creando cita: idServicio={}, idStaff={}, idCliente={}, fechaHoraInicio={}",
                request.idServicio(), request.idStaff(), request.idCliente(), request.fechaHoraInicio());

        liberarReservasVencidas();

        if (request.idCliente() == null) {
            throw new BusinessException("No fue posible identificar al cliente autenticado");
        }

        perfilClient.obtenerCliente(request.idCliente());
        var staff = perfilClient.obtenerStaff(request.idStaff());
        validarStaffActivo(staff);

        ServicioResumen servicio = servicioClient.obtenerServicio(request.idServicio());
        validarStaffRealizaServicio(request.idServicio(), request.idStaff());
        BigDecimal totalEstimado = precioServicio(servicio);
        BigDecimal abono = reservaTemporal ? normalizarAbonoOpcional(request.abono()) : validarAbonoAdmin(request.abono());
        validarAbonoNoSupereTotal(abono, totalEstimado);
        BigDecimal saldoPendiente = calcularSaldoPendiente(totalEstimado, abono);

        int duracion = duracionServicio(servicio, request.duracionServicioMin(), !reservaTemporal);
        int holgura = holguraService.calcularHolguraMin(servicio, staff.holguraCitaMinutos());

        validarDuracionYHolgura(duracion, holgura);

        OffsetDateTime inicio = normalizarAZoneAgenda(request.fechaHoraInicio());
        OffsetDateTime finAtencion = inicio.plusMinutes(duracion);
        OffsetDateTime finVisible = finAtencion.plusMinutes(holgura);
        OffsetDateTime expiracionReserva = reservaTemporal
                ? OffsetDateTime.now(zoneId()).plusMinutes(minutosReservaTemporal)
                : null;

        validarFechaReservable(inicio.toLocalDate());
        validarFechaHoraReservable(inicio, finAtencion);
        validarJornada(request.idStaff(), inicio, finAtencion);
        validarBloqueos(request.idStaff(), inicio, finVisible);
        validarChoqueCitas(request.idStaff(), inicio, finVisible);
        validarChoqueCliente(request.idCliente(), inicio, finAtencion);
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
                .estadoCita(estadoInicial)
                .tipoCita(TipoCita.NORMAL)
                .expiracionReserva(expiracionReserva)
                .observacionCliente(request.observacionCliente())
                .montoAbonado(abono)
                .totalEstimado(totalEstimado)
                .saldoPendiente(saldoPendiente)
                .build();

        Cita guardada = guardarSinSolape(cita);
        if (reservaTemporal) {
            refrescarExpiracionReservasPendientesCliente(guardada.getIdCliente(), expiracionReserva);
        }

        registrarHistorial(
                guardada.getIdCita(),
                AccionHistorial.CREADA,
                null,
                guardada.getEstadoCita().name(),
                reservaTemporal
                        ? "Reserva temporal agregada al carrito. Expira en " + minutosReservaTemporal + " minutos"
                        : "Reserva creada desde panel administrativo"
        );

        return guardada;
    }

    private void validarLoteBase(CrearCitasLoteRequest request) {
        if (request.idCliente() == null) {
            throw new BusinessException("Selecciona un cliente para crear la agenda.");
        }

        if (request.fecha() == null) {
            throw new BusinessException("Selecciona una fecha para crear la agenda.");
        }

        validarFechaReservable(request.fecha());

        if (request.reservas() == null || request.reservas().size() < 2) {
            throw new BusinessException("Agrega al menos dos servicios para crear la agenda.");
        }

        Set<UUID> servicios = new HashSet<>();
        for (CrearCitasLoteRequest.ReservaLoteRequest reserva : request.reservas()) {
            if (reserva.idServicio() == null || reserva.idStaff() == null || reserva.horaInicio() == null) {
                throw new BusinessException("Cada servicio de la agenda requiere servicio, profesional y hora.");
            }
            if (!servicios.add(reserva.idServicio())) {
                throw new BusinessException("La agenda múltiple requiere servicios distintos.");
            }
        }
    }

    private void validarSlotLoteMasCercano(
            UUID idStaff,
            LocalDate fecha,
            OffsetDateTime inicio,
            OffsetDateTime finVisible,
            int duracion,
            int holgura,
            OffsetDateTime finAnterior
    ) {
        List<DisponibilidadSlot> slots = calcularDisponibilidadParaDia(
                idStaff,
                fecha,
                duracion,
                holgura,
                null
        ).stream()
                .sorted(Comparator.comparing(DisponibilidadSlot::inicio))
                .toList();

        if (finAnterior == null) {
            boolean existeSlot = slots.stream()
                    .anyMatch(slot -> slot.inicio().isEqual(inicio)
                            && slot.finVisible().isEqual(finVisible));

            if (!existeSlot) {
                throw new BusinessException("El horario seleccionado ya no esta disponible");
            }
            return;
        }

        DisponibilidadSlot slotEsperado = slots.stream()
                .filter(slot -> !slot.inicio().isBefore(finAnterior))
                .findFirst()
                .orElseThrow(() -> new BusinessException("No fue posible encadenar todos los servicios dentro del horario laboral del profesional."));

        if (!slotEsperado.inicio().isEqual(inicio) || !slotEsperado.finVisible().isEqual(finVisible)) {
            throw new BusinessException("Los servicios posteriores deben usar el horario disponible mas cercano al termino del servicio anterior.");
        }
    }

    private void validarChoqueLote(
            List<Cita> preparadas,
            UUID idCliente,
            UUID idStaff,
            OffsetDateTime inicio,
            OffsetDateTime finVisible
    ) {
        for (Cita cita : preparadas) {
            boolean mismoStaff = Objects.equals(cita.getIdStaff(), idStaff);
            boolean mismoCliente = Objects.equals(cita.getIdCliente(), idCliente);
            if ((mismoStaff || mismoCliente)
                    && haySolape(cita.getFechaHoraInicio(), cita.getFechaHoraFin(), inicio, finVisible)) {
                if (mismoStaff) {
                    throw new BusinessException("El profesional ya tiene una reserva en ese horario.");
                }
                throw new BusinessException("El cliente ya tiene una reserva en ese horario.");
            }
        }
    }

    private String notaLote(CrearCitasLoteRequest.ReservaLoteRequest reserva) {
        String nota = reserva.nota();
        return nota == null || nota.isBlank()
                ? "Reserva creada desde agenda multiple del panel administrativo"
                : nota;
    }

    private CrearCitasLoteResponse toLoteResponse(
            UUID idCliente,
            LocalDate fecha,
            BigDecimal totalEstimado,
            BigDecimal abono,
            BigDecimal saldoPendiente,
            List<Cita> citas
    ) {
        List<Cita> ordenadas = citas.stream()
                .sorted(Comparator.comparing(Cita::getFechaHoraInicio))
                .toList();

        int tiempoTotal = ordenadas.isEmpty()
                ? 0
                : (int) Duration.between(
                        ordenadas.get(0).getFechaHoraInicio(),
                        ordenadas.get(ordenadas.size() - 1).getFechaHoraFin()
                ).toMinutes();

        List<CrearCitasLoteResponse.ReservaLoteCreadaResponse> reservas = ordenadas.stream()
                .map(cita -> new CrearCitasLoteResponse.ReservaLoteCreadaResponse(
                        cita.getIdCita(),
                        cita.getIdServicio(),
                        cita.getIdStaff(),
                        cita.getFechaHoraInicio(),
                        cita.getFechaHoraFin(),
                        cita.getFechaHoraFinAtencion(),
                        cita.getDuracionServicioMin(),
                        cita.getHolguraMin(),
                        cita.getEstadoCita(),
                        cita.getExpiracionReserva()
                ))
                .toList();

        return new CrearCitasLoteResponse(
                idCliente,
                fecha,
                reservas.size(),
                tiempoTotal,
                totalEstimado,
                abono,
                saldoPendiente,
                reservas
        );
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
    public Cita evaluarCita(UUID idCita, UUID idCliente, EvaluarCitaRequest request) {
        log.info("Evaluando cita: idCita={}, idCliente={}, calificacion={}", idCita, idCliente, request.calificacion());

        Cita cita = buscarPorId(idCita);

        if (!Objects.equals(cita.getIdCliente(), idCliente)) {
            throw new BusinessException("Solo puedes evaluar tus propias citas.");
        }

        if (cita.getEstadoCita() != EstadoCita.FINALIZADA) {
            throw new BusinessException("Solo puedes evaluar citas que ya fueron finalizadas.");
        }

        if (cita.getCalificacion() != null) {
            throw new BusinessException("Esta cita ya fue evaluada anteriormente.");
        }

        cita.setCalificacion(request.calificacion());
        cita.setComentarioCalificacion(request.comentarioCalificacion());

        Cita evaluada = citaRepository.save(cita);

        registrarHistorial(
                idCita,
                AccionHistorial.MODIFICADA,
                EstadoCita.FINALIZADA.name(),
                EstadoCita.FINALIZADA.name(),
                "Cliente evaluó la cita con calificación " + request.calificacion()
        );

        return evaluada;
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
        return duracionServicio(servicio, null, false);
    }

    private int duracionServicio(ServicioResumen servicio, Integer duracionSolicitada, boolean permiteOverride) {

        if (servicio.duracionMinutos() == null || servicio.duracionMinutos() <= 0) {
            throw new BusinessException("La duración del servicio debe estar configurada en ms-catalogo");
        }

        int duracionBase = servicio.duracionMinutos();
        if (!permiteOverride || duracionSolicitada == null) {
            return duracionBase;
        }

        int duracionMin = servicio.duracionMinutosMin() == null || servicio.duracionMinutosMin() <= 0
                ? duracionBase
                : servicio.duracionMinutosMin();
        int duracionMax = servicio.duracionMinutosMax() == null || servicio.duracionMinutosMax() <= 0
                ? duracionBase
                : servicio.duracionMinutosMax();

        if (duracionMin > duracionMax) {
            throw new BusinessException("El rango de duración del servicio está mal configurado en ms-catalogo");
        }

        if (duracionSolicitada < duracionMin || duracionSolicitada > duracionMax) {
            throw new BusinessException("La duración seleccionada debe estar dentro del rango configurado del servicio");
        }

        return duracionSolicitada;
    }

    private BigDecimal precioServicio(ServicioResumen servicio) {
        if (servicio.precioTotal() == null || servicio.precioTotal().compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        return servicio.precioTotal();
    }

    private BigDecimal validarAbonoAdmin(BigDecimal abono) {
        BigDecimal normalizado = normalizarAbonoOpcional(abono);
        if (normalizado == null) {
            throw new BusinessException("Ingresa el abono realizado para continuar.");
        }
        return normalizado;
    }

    private BigDecimal normalizarAbonoOpcional(BigDecimal abono) {
        if (abono == null) {
            return null;
        }
        if (abono.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Ingresa el abono realizado para continuar.");
        }
        return abono;
    }

    private void validarAbonoNoSupereTotal(BigDecimal abono, BigDecimal totalEstimado) {
        if (abono == null || totalEstimado == null || totalEstimado.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        if (abono.compareTo(totalEstimado) > 0) {
            throw new BusinessException("El abono no puede ser mayor al total de la reserva.");
        }
    }

    private BigDecimal calcularSaldoPendiente(BigDecimal totalEstimado, BigDecimal abono) {
        if (totalEstimado == null || totalEstimado.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal abonado = abono == null ? BigDecimal.ZERO : abono;
        BigDecimal saldo = totalEstimado.subtract(abonado);
        return saldo.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : saldo;
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

    private void validarStaffActivo(PerfilResumen staff) {
        if (staff == null || staff.idPersona() == null) {
            throw new BusinessException("No se pudo validar el profesional seleccionado");
        }
        if (Boolean.FALSE.equals(staff.activo())) {
            throw new BusinessException("El profesional seleccionado no está activo");
        }
    }

    private OffsetDateTime finAtencionCliente(Cita cita) {
        return cita.getFechaHoraFinAtencion() == null ? cita.getFechaHoraFin() : cita.getFechaHoraFinAtencion();
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

    private void validarChoqueCliente(UUID idCliente, OffsetDateTime inicio, OffsetDateTime finAtencion) {

        List<EstadoCita> ignorados = estadosIgnoradosParaDisponibilidad();

        boolean existeChoque = citaRepository
                .buscarChoquesCliente(idCliente, inicio, finAtencion, ignorados)
                .stream()
                .anyMatch(cita -> haySolape(cita.getFechaHoraInicio(), finAtencionCliente(cita), inicio, finAtencion));

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

        if (!dentroDeJornadaReservable(fecha, inicio, finAtencion, jornadas)) {
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
        if (cita.getFechaHoraFinAtencion() != null) {
            return cita.getFechaHoraFinAtencion().plusMinutes(MINUTOS_SEPARACION_TECNICA);
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

    private OffsetDateTime atDateTime(LocalDate date, LocalTime time) {
        return date.atTime(time)
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
        if (desde != null && hasta != null && hasta.isBefore(desde)) {
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
                cita.getGoogleCalendarEventId(),
                cita.getCalificacion(),
                cita.getComentarioCalificacion()
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
                ABONO_RESERVA_CLP,
                cita.getCalificacion(),
                cita.getComentarioCalificacion()
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

    private record ServicioPlanEntrada(
            UUID idServicio,
            UUID idStaffSolicitado,
            ServicioResumen servicio,
            int duracion,
            BigDecimal precio
    ) {
    }

    private record AsignacionPlan(
            PerfilResumen staff,
            OffsetDateTime inicio,
            OffsetDateTime finAtencion,
            OffsetDateTime bloqueadoHasta
    ) {
    }

    private record BloquePlanificado(
            UUID idStaff,
            OffsetDateTime inicio,
            OffsetDateTime finAtencion,
            OffsetDateTime bloqueadoHasta
    ) {
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
