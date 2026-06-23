package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CitaAgendaResponse;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.CrearCitasLoteRequest;
import com.style.beauty.ms_agenda.dto.CrearCitasLoteResponse;
import com.style.beauty.ms_agenda.dto.DisponibilidadMensualResponse;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSemanalRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.dto.EvaluarCitaRequest;
import com.style.beauty.ms_agenda.dto.ProximaCitaClienteResponse;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
import com.style.beauty.ms_agenda.service.CitaService;
import com.style.beauty.ms_agenda.service.FirebaseTokenVerifier;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agenda/citas")
@RequiredArgsConstructor
@Slf4j
public class CitaController {

    private final CitaService citaService;
    private final PerfilClient perfilClient;
    private final FirebaseTokenVerifier firebaseTokenVerifier;

    @GetMapping
    public List<Cita> listar() {
        log.info("Entrando a endpoint GET /api/agenda/citas");
        return citaService.listar();
    }

    @GetMapping("/staff/{idStaff}")
    public List<CitaAgendaResponse> listarPorStaff(@PathVariable UUID idStaff) {
        log.info("Entrando a endpoint GET /api/agenda/citas/staff/{idStaff}: idStaff={}", idStaff);
        return citaService.listarAgendaStaff(idStaff);
    }

    @GetMapping("/disponibilidad")
    public List<DisponibilidadSlot> disponibilidadGet(
            @RequestParam UUID idStaff,
            @RequestParam UUID idServicio,
            @RequestParam LocalDate fecha,
            @RequestParam(required = false) Integer duracionServicioMin,
            @RequestParam(required = false) Integer holguraMin,
            @RequestParam(required = false) UUID idCliente
    ) {
        log.info("Entrando a endpoint GET /api/agenda/citas/disponibilidad");
        log.info("Request recibido disponibilidad: idServicio={}, idStaff={}, fecha={}",
                idServicio, idStaff, fecha);

        return citaService.calcularDisponibilidad(
                new DisponibilidadRequest(idStaff, idServicio, fecha, duracionServicioMin, holguraMin, idCliente)
        );
    }

    @PostMapping("/disponibilidad")
    public List<DisponibilidadSlot> disponibilidad(@Valid @RequestBody DisponibilidadRequest request) {
        log.info("Entrando a endpoint POST /api/agenda/citas/disponibilidad");
        log.info("Request recibido disponibilidad: idServicio={}, idStaff={}, fecha={}",
                request.idServicio(), request.idStaff(), request.fecha());

        return citaService.calcularDisponibilidad(request);
    }

    @GetMapping("/disponibilidad-semanal")
    public List<DisponibilidadMensualResponse> disponibilidadSemanalGet(
            @RequestParam UUID idStaff,
            @RequestParam UUID idServicio,
            @RequestParam LocalDate fechaInicioSemana,
            @RequestParam(required = false) UUID idCliente
    ) {
        log.info("Entrando a endpoint GET /api/agenda/citas/disponibilidad-semanal");
        log.info("Request recibido disponibilidad semanal: idServicio={}, idStaff={}, fechaInicioSemana={}",
                idServicio, idStaff, fechaInicioSemana);

        return citaService.calcularDisponibilidadSemanal(
                new DisponibilidadSemanalRequest(idStaff, idServicio, fechaInicioSemana, idCliente)
        );
    }

    @PostMapping("/disponibilidad-semanal")
    public List<DisponibilidadMensualResponse> disponibilidadSemanal(@Valid @RequestBody DisponibilidadSemanalRequest request) {
        log.info("Entrando a endpoint POST /api/agenda/citas/disponibilidad-semanal");
        log.info("Request recibido disponibilidad semanal: idServicio={}, idStaff={}, fechaInicioSemana={}",
                request.idServicio(), request.idStaff(), request.fechaInicioSemana());

        return citaService.calcularDisponibilidadSemanal(request);
    }

    @GetMapping("/mis-proximas")
    public List<ProximaCitaClienteResponse> misProximas(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Entrando a endpoint GET /api/agenda/citas/mis-proximas");

        PerfilResumen cliente = resolverClienteAutenticado(authHeader, "mis-proximas");
        List<ProximaCitaClienteResponse> proximas = citaService.listarProximasCliente(cliente.idPersona());
        log.info("Reservas proximas retornadas: uidFirebase={}, idCliente={}, cantidad={}",
                cliente.idAuth(), cliente.idPersona(), proximas.size());
        return proximas;
    }

    @GetMapping("/historial")
    public List<ProximaCitaClienteResponse> historial(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Entrando a endpoint GET /api/agenda/citas/historial");

        PerfilResumen cliente = resolverClienteAutenticado(authHeader, "historial");
        return citaService.listarHistorialCliente(cliente.idPersona());
    }

    @GetMapping("/mis-citas")
    public List<CitaAgendaResponse> misCitasStaff(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Entrando a endpoint GET /api/agenda/citas/mis-citas");

        String uid = firebaseTokenVerifier.authenticatedUid(authHeader);
        PerfilResumen staff = perfilClient.obtenerStaffPorAuthId(uid);
        return citaService.listarAgendaStaff(staff.idPersona());
    }

    @PatchMapping("/mis-citas/{id:[0-9a-fA-F-]+}/finalizar")
    public Cita finalizarMiCita(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID id) {
        log.info("Entrando a endpoint PATCH /api/agenda/citas/mis-citas/{id}/finalizar: id={}", id);

        String uid = firebaseTokenVerifier.authenticatedUid(authHeader);
        PerfilResumen staff = perfilClient.obtenerStaffPorAuthId(uid);
        return citaService.finalizarCitaStaff(id, staff.idPersona());
    }

    @GetMapping("/{id:[0-9a-fA-F-]+}")
    public Cita buscarPorId(@PathVariable UUID id) {
        log.info("Entrando a endpoint GET /api/agenda/citas/{id}: id={}", id);
        return citaService.buscarPorId(id);
    }

    @PostMapping
    public Cita crear(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CrearCitaRequest request) {
        log.info("Entrando a endpoint POST /api/agenda/citas");
        log.info("Request recibido crear cita: idServicio={}, idStaff={}, fechaHoraInicio={}",
                request.idServicio(), request.idStaff(), request.fechaHoraInicio());

        String uid = firebaseTokenVerifier.authenticatedClientUid(authHeader);
        PerfilResumen cliente = perfilClient.obtenerClientePorAuthId(uid);
        return citaService.crear(request.withCliente(cliente.idPersona()));
    }

    @PostMapping("/admin")
    public Cita crearDesdeAdmin(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CrearCitaRequest request) {
        log.info("Entrando a endpoint POST /api/agenda/citas/admin");
        log.info("Request recibido crear cita admin: idCliente={}, idServicio={}, idStaff={}, fechaHoraInicio={}",
                request.idCliente(), request.idServicio(), request.idStaff(), request.fechaHoraInicio());

        firebaseTokenVerifier.authenticatedAdminUid(authHeader);
        return citaService.crearDesdeAdmin(request);
    }

    @PostMapping("/lote")
    public CrearCitasLoteResponse crearLoteDesdeAdmin(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CrearCitasLoteRequest request) {
        log.info("Entrando a endpoint POST /api/agenda/citas/lote");
        log.info("Request recibido crear lote admin: idCliente={}, fecha={}, reservas={}",
                request.idCliente(), request.fecha(), request.reservas() == null ? 0 : request.reservas().size());

        firebaseTokenVerifier.authenticatedAdminUid(authHeader);
        return citaService.crearLoteDesdeAdmin(request);
    }

    @PatchMapping("/{id:[0-9a-fA-F-]+}/estado")
    public Cita actualizarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody ActualizarEstadoCitaRequest request) {
        log.info("Entrando a endpoint PATCH /api/agenda/citas/{id}/estado: id={}, estado={}",
                id, request.estadoCita());

        return citaService.actualizarEstado(id, request);
    }

    @DeleteMapping("/{id:[0-9a-fA-F-]+}")
    public void cancelar(@PathVariable UUID id) {
        log.info("Entrando a endpoint DELETE /api/agenda/citas/{id}: id={}", id);
        citaService.cancelar(id);
    }

    @PostMapping("/{id:[0-9a-fA-F-]+}/evaluar")
    public Cita evaluarCita(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID id,
            @Valid @RequestBody EvaluarCitaRequest request) {
        log.info("Entrando a endpoint POST /api/agenda/citas/{id}/evaluar: id={}, calificacion={}", id, request.calificacion());

        String uid = firebaseTokenVerifier.authenticatedClientUid(authHeader);
        PerfilResumen cliente = perfilClient.obtenerClientePorAuthId(uid);
        return citaService.evaluarCita(id, cliente.idPersona(), request);
    }

    @GetMapping("/mis-citas-finalizadas")
    public List<CitaAgendaResponse> misCitasFinalizadas(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Entrando a endpoint GET /api/agenda/citas/mis-citas-finalizadas");

        PerfilResumen cliente = resolverClienteAutenticado(authHeader, "mis-citas-finalizadas");
        return citaService.listarCitasFinalizadasCliente(cliente.idPersona());
    }

    private PerfilResumen resolverClienteAutenticado(String authHeader, String endpoint) {
        FirebaseTokenVerifier.AuthenticatedUser authenticatedUser = firebaseTokenVerifier.authenticatedUser(authHeader);
        String uid = authenticatedUser.uid();
        String role = authenticatedUser.role();
        log.info("Sesion Firebase validada para agenda cliente: endpoint={}, uidFirebase={}, rol={}",
                endpoint, uid, role == null ? "SIN_ROL" : role);

        if (role != null && !"CLIENTE".equalsIgnoreCase(role)) {
            log.info("Endpoint cliente bloqueado por rol no cliente: endpoint={}, uidFirebase={}, rol={}",
                    endpoint, uid, role);
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Este endpoint está disponible solo para clientes");
        }

        try {
            PerfilResumen cliente = perfilClient.obtenerClientePorAuthId(uid);
            if (cliente.idPersona() == null) {
                log.warn("Perfil cliente sin idPersona: endpoint={}, uidFirebase={}", endpoint, uid);
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil cliente no encontrado");
            }
            log.info("Perfil cliente asociado encontrado: endpoint={}, uidFirebase={}, idCliente={}",
                    endpoint, uid, cliente.idPersona());
            return cliente;
        } catch (ResourceNotFoundException ex) {
            log.info("Perfil cliente no encontrado para usuario autenticado: endpoint={}, uidFirebase={}, motivo={}",
                    endpoint, uid, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil cliente no encontrado", ex);
        } catch (BusinessException ex) {
            log.warn("No fue posible validar perfil cliente: endpoint={}, uidFirebase={}, motivo={}",
                    endpoint, uid, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No fue posible validar la sesión", ex);
        }
    }
}
