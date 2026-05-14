package com.style.beauty.ms_pagos.service;

import com.style.beauty.ms_pagos.dto.ConfirmarPagoRequest;
import com.style.beauty.ms_pagos.dto.CrearTransaccionRequest;
import com.style.beauty.ms_pagos.entity.Transaccion;
import com.style.beauty.ms_pagos.enums.EstadoPago;
import com.style.beauty.ms_pagos.enums.TipoPago;
import com.style.beauty.ms_pagos.exception.BusinessException;
import com.style.beauty.ms_pagos.exception.ResourceNotFoundException;
import com.style.beauty.ms_pagos.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransaccionService {

    private final TransaccionRepository transaccionRepository;

    public List<Transaccion> listar() {
        return transaccionRepository.findAll();
    }

    public Transaccion buscarPorId(UUID id) {
        return transaccionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transacción no encontrada"));
    }

    @Transactional
    public Transaccion iniciar(CrearTransaccionRequest request) {
        validarReferencia(request);

        int montoAbono = request.montoAbono() != null ? request.montoAbono() : 10000;
        int montoRecargo = request.montoRecargo() != null ? request.montoRecargo() : 0;

        if (montoAbono <= 0) {
            throw new BusinessException("El monto de abono debe ser mayor a 0");
        }

        if (request.montoTotal() < montoAbono) {
            throw new BusinessException("El monto total no puede ser menor al abono");
        }

        Transaccion transaccion = Transaccion.builder()
                .idCita(request.idCita())
                .idCitaExtraordinaria(request.idCitaExtraordinaria())
                .montoTotal(request.montoTotal())
                .montoAbono(montoAbono)
                .montoRecargo(montoRecargo)
                .tipoPago(request.tipoPago())
                .estadoPago(EstadoPago.INICIADA)
                .codigoWebpay("WEBPAY-" + UUID.randomUUID())
                .tokenWebpay("TOKEN-" + UUID.randomUUID())
                .build();

        return transaccionRepository.save(transaccion);
    }

    @Transactional
    public Transaccion confirmar(UUID id, ConfirmarPagoRequest request) {
        Transaccion transaccion = buscarPorId(id);

        if (transaccion.getEstadoPago() != EstadoPago.INICIADA) {
            throw new BusinessException("Solo se pueden confirmar pagos en estado INICIADA");
        }

        if (!transaccion.getCodigoWebpay().equals(request.codigoWebpay())) {
            throw new BusinessException("Código Webpay inválido");
        }

        if (!transaccion.getTokenWebpay().equals(request.tokenWebpay())) {
            throw new BusinessException("Token Webpay inválido");
        }

        transaccion.setEstadoPago(EstadoPago.APROBADA);
        transaccion.setFechaPago(OffsetDateTime.now());

        return transaccionRepository.save(transaccion);
    }

    @Transactional
    public Transaccion rechazar(UUID id) {
        Transaccion transaccion = buscarPorId(id);

        if (transaccion.getEstadoPago() != EstadoPago.INICIADA) {
            throw new BusinessException("Solo se pueden rechazar pagos en estado INICIADA");
        }

        transaccion.setEstadoPago(EstadoPago.RECHAZADA);
        return transaccionRepository.save(transaccion);
    }

    @Transactional
    public Transaccion expirar(UUID id) {
        Transaccion transaccion = buscarPorId(id);

        if (transaccion.getEstadoPago() != EstadoPago.INICIADA) {
            throw new BusinessException("Solo se pueden expirar pagos en estado INICIADA");
        }

        transaccion.setEstadoPago(EstadoPago.EXPIRADA);
        return transaccionRepository.save(transaccion);
    }

    private void validarReferencia(CrearTransaccionRequest request) {
        if (request.tipoPago() == TipoPago.CITA_NORMAL && request.idCita() == null) {
            throw new BusinessException("Para CITA_NORMAL debe enviarse idCita");
        }

        if (request.tipoPago() == TipoPago.CITA_EXTRAORDINARIA && request.idCitaExtraordinaria() == null) {
            throw new BusinessException("Para CITA_EXTRAORDINARIA debe enviarse idCitaExtraordinaria");
        }
    }
}