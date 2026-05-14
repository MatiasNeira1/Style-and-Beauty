package com.style.beauty.ms_extra.service;

import com.style.beauty.ms_extra.dto.ChatRequest;
import com.style.beauty.ms_extra.dto.CrearCitaExtraordinariaRequest;
import com.style.beauty.ms_extra.dto.PropuestaStaffRequest;
import com.style.beauty.ms_extra.entity.ChatExtraordinario;
import com.style.beauty.ms_extra.entity.CitaExtraordinaria;
import com.style.beauty.ms_extra.enums.EstadoNegociacion;
import com.style.beauty.ms_extra.exception.BusinessException;
import com.style.beauty.ms_extra.exception.ResourceNotFoundException;
import com.style.beauty.ms_extra.repository.ChatExtraordinarioRepository;
import com.style.beauty.ms_extra.repository.CitaExtraordinariaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CitaExtraordinariaService {

    private final CitaExtraordinariaRepository citaExtraordinariaRepository;
    private final ChatExtraordinarioRepository chatExtraordinarioRepository;

    public List<CitaExtraordinaria> listar() {
        return citaExtraordinariaRepository.findAll();
    }

    public CitaExtraordinaria buscarPorId(UUID id) {
        return citaExtraordinariaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita extraordinaria no encontrada"));
    }

    @Transactional
    public CitaExtraordinaria solicitar(CrearCitaExtraordinariaRequest request) {
        CitaExtraordinaria cita = CitaExtraordinaria.builder()
                .idCliente(request.idCliente())
                .idStaff(request.idStaff())
                .idServicio(request.idServicio())
                .fechaHoraSolicitada(request.fechaHoraSolicitada())
                .motivoCliente(request.motivoCliente())
                .precioBase(request.precioBase())
                .recargo(0)
                .montoTotal(request.precioBase())
                .estadoNegociacion(EstadoNegociacion.SOLICITADA)
                .build();

        return citaExtraordinariaRepository.save(cita);
    }

    @Transactional
    public CitaExtraordinaria proponerHorario(UUID id, PropuestaStaffRequest request) {
        CitaExtraordinaria cita = buscarPorId(id);

        if (cita.getEstadoNegociacion() == EstadoNegociacion.CONFIRMADA ||
                cita.getEstadoNegociacion() == EstadoNegociacion.CANCELADA) {
            throw new BusinessException("No se puede modificar una cita extraordinaria confirmada o cancelada");
        }

        cita.setFechaHoraPropuesta(request.fechaHoraPropuesta());
        cita.setRespuestaStaff(request.respuestaStaff());
        cita.setRecargo(request.recargo());
        cita.setMontoTotal(cita.getPrecioBase() + request.recargo());
        cita.setEstadoNegociacion(EstadoNegociacion.PROPUESTA_STAFF);

        return citaExtraordinariaRepository.save(cita);
    }

    @Transactional
    public CitaExtraordinaria aceptarCliente(UUID id) {
        CitaExtraordinaria cita = buscarPorId(id);

        if (cita.getEstadoNegociacion() != EstadoNegociacion.PROPUESTA_STAFF) {
            throw new BusinessException("Solo se puede aceptar una propuesta realizada por el staff");
        }

        cita.setEstadoNegociacion(EstadoNegociacion.PENDIENTE_PAGO);
        return citaExtraordinariaRepository.save(cita);
    }

    @Transactional
    public CitaExtraordinaria rechazarCliente(UUID id) {
        CitaExtraordinaria cita = buscarPorId(id);
        cita.setEstadoNegociacion(EstadoNegociacion.RECHAZADA_CLIENTE);
        return citaExtraordinariaRepository.save(cita);
    }

    @Transactional
    public void eliminar(UUID id) {
        CitaExtraordinaria cita = buscarPorId(id);
        chatExtraordinarioRepository.deleteByIdCitaExtraordinaria(id);
        citaExtraordinariaRepository.delete(cita);
    }

    @Transactional
    public CitaExtraordinaria rechazarStaff(UUID id, String respuestaStaff) {
        CitaExtraordinaria cita = buscarPorId(id);
        cita.setRespuestaStaff(respuestaStaff);
        cita.setEstadoNegociacion(EstadoNegociacion.RECHAZADA_STAFF);
        return citaExtraordinariaRepository.save(cita);
    }

    @Transactional
    public CitaExtraordinaria confirmarPago(UUID id, UUID idCitaGenerada) {
        CitaExtraordinaria cita = buscarPorId(id);

        if (cita.getEstadoNegociacion() != EstadoNegociacion.PENDIENTE_PAGO) {
            throw new BusinessException("La cita extraordinaria no está pendiente de pago");
        }

        cita.setEstadoNegociacion(EstadoNegociacion.CONFIRMADA);
        cita.setFechaAprobacion(OffsetDateTime.now());
        cita.setIdCita(idCitaGenerada);

        return citaExtraordinariaRepository.save(cita);
    }

    @Transactional
    public ChatExtraordinario enviarMensaje(UUID idCitaExtraordinaria, ChatRequest request) {
        buscarPorId(idCitaExtraordinaria);

        ChatExtraordinario mensaje = ChatExtraordinario.builder()
                .idCitaExtraordinaria(idCitaExtraordinaria)
                .idUsuario(request.idUsuario())
                .remitente(request.remitente())
                .mensaje(request.mensaje())
                .build();

        return chatExtraordinarioRepository.save(mensaje);
    }

    public List<ChatExtraordinario> listarChat(UUID idCitaExtraordinaria) {
        buscarPorId(idCitaExtraordinaria);
        return chatExtraordinarioRepository
                .findByIdCitaExtraordinariaOrderByFechaEnvioAsc(idCitaExtraordinaria);
    }
}
