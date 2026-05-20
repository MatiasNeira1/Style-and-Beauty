package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.dto.ActualizarEstadoCitaRequest;
import com.style.beauty.ms_agenda.dto.CrearCitaRequest;
import com.style.beauty.ms_agenda.entity.Cita;
import com.style.beauty.ms_agenda.entity.HistorialCita;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CitaService {

    private final CitaRepository citaRepository;
    private final JornadaStaffRepository jornadaStaffRepository;
    private final BloqueoAgendaRepository bloqueoAgendaRepository;
    private final HistorialCitaRepository historialCitaRepository;

    public List<Cita> listar() {
        return citaRepository.findAll();
    }

    public Cita buscarPorId(UUID id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));
    }

    @Transactional
    public Cita crear(CrearCitaRequest request) {
        int holgura = request.holguraMin() != null ? request.holguraMin() : 20;

        OffsetDateTime inicio = request.fechaHoraInicio();
        OffsetDateTime fin = inicio.plusMinutes(request.duracionServicioMin());
        OffsetDateTime finConHolgura = fin.plusMinutes(holgura);

        validarJornada(request.idStaff(), inicio, fin);
        validarBloqueos(request.idStaff(), inicio, finConHolgura);
        validarChoqueCitas(request.idStaff(), inicio, finConHolgura);

        Cita cita = Cita.builder()
                .idCliente(request.idCliente())
                .idStaff(request.idStaff())
                .idServicio(request.idServicio())
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .fechaHoraFinHolgura(finConHolgura)
                .duracionServicioMin(request.duracionServicioMin())
                .holguraMin(holgura)
                .estadoCita(EstadoCita.PENDIENTE_PAGO)
                .tipoCita(TipoCita.NORMAL)
                .expiracionReserva(OffsetDateTime.now().plusMinutes(15))
                .observacionCliente(request.observacionCliente())
                .build();

        Cita guardada = citaRepository.save(cita);

        registrarHistorial(
                guardada.getIdCita(),
                AccionHistorial.CREADA,
                null,
                guardada.getEstadoCita().name(),
                "Cita creada en estado pendiente de pago");

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

    private void validarJornada(UUID idStaff, OffsetDateTime inicio, OffsetDateTime fin) {
        int diaSemana = inicio.getDayOfWeek().getValue();

        boolean dentroDeJornada = jornadaStaffRepository
                .findByIdStaffAndDiaSemanaAndActivoTrue(idStaff, diaSemana)
                .stream()
                .anyMatch(j -> !inicio.toLocalTime().isBefore(j.getHoraInicio())
                        && !fin.toLocalTime().isAfter(j.getHoraFin()));

        if (!dentroDeJornada) {
            throw new BusinessException("El staff no tiene jornada disponible para ese horario");
        }
    }

    private void validarBloqueos(UUID idStaff, OffsetDateTime inicio, OffsetDateTime finConHolgura) {
        boolean existeBloqueo = !bloqueoAgendaRepository
                .buscarBloqueosEnRango(idStaff, inicio, finConHolgura)
                .isEmpty();

        if (existeBloqueo) {
            throw new BusinessException("Existe un bloqueo de agenda para ese horario");
        }
    }

    private void validarChoqueCitas(UUID idStaff, OffsetDateTime inicio, OffsetDateTime finConHolgura) {
        List<EstadoCita> ignorados = List.of(
                EstadoCita.CANCELADA,
                EstadoCita.EXPIRADA,
                EstadoCita.RECHAZADA);

        boolean existeChoque = !citaRepository
                .buscarChoquesAgenda(idStaff, inicio, finConHolgura, ignorados)
                .isEmpty();

        if (existeChoque) {
            throw new BusinessException("Ya existe una cita en ese horario");
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
