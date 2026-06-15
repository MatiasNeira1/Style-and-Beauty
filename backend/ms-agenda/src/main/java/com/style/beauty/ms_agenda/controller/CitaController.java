package com.style.beauty.ms_agenda.controller;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadMensualResponse;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSemanalRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.service.CitaService;
import com.style.beauty.ms_agenda.service.FirebaseTokenVerifier;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/disponibilidad")
    public List<DisponibilidadSlot> disponibilidadGet(
            @RequestParam UUID idStaff,
            @RequestParam UUID idServicio,
            @RequestParam LocalDate fecha,
            @RequestParam(required = false) Integer duracionServicioMin,
            @RequestParam(required = false) Integer holguraMin
    ) {
        log.info("Entrando a endpoint GET /api/agenda/citas/disponibilidad");
        log.info("Request recibido disponibilidad: idServicio={}, idStaff={}, fecha={}",
                idServicio, idStaff, fecha);

        return citaService.calcularDisponibilidad(
                new DisponibilidadRequest(idStaff, idServicio, fecha, duracionServicioMin, holguraMin)
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
            @RequestParam LocalDate fechaInicioSemana
    ) {
        log.info("Entrando a endpoint GET /api/agenda/citas/disponibilidad-semanal");
        log.info("Request recibido disponibilidad semanal: idServicio={}, idStaff={}, fechaInicioSemana={}",
                idServicio, idStaff, fechaInicioSemana);

        return citaService.calcularDisponibilidadSemanal(
                new DisponibilidadSemanalRequest(idStaff, idServicio, fechaInicioSemana)
        );
    }

    @PostMapping("/disponibilidad-semanal")
    public List<DisponibilidadMensualResponse> disponibilidadSemanal(@Valid @RequestBody DisponibilidadSemanalRequest request) {
        log.info("Entrando a endpoint POST /api/agenda/citas/disponibilidad-semanal");
        log.info("Request recibido disponibilidad semanal: idServicio={}, idStaff={}, fechaInicioSemana={}",
                request.idServicio(), request.idStaff(), request.fechaInicioSemana());

        return citaService.calcularDisponibilidadSemanal(request);
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
}
