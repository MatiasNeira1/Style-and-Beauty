package com.style.beauty.ms_pagos.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.style.beauty.ms_pagos.client.AgendaClient;
import com.style.beauty.ms_pagos.client.CatalogoClient;
import com.style.beauty.ms_pagos.dto.CitaResumen;
import com.style.beauty.ms_pagos.dto.CrearTransaccionRequest;
import com.style.beauty.ms_pagos.dto.CrearTransaccionResponse;
import com.style.beauty.ms_pagos.dto.ServicioCatalogoResumen;
import com.style.beauty.ms_pagos.entity.TransaccionPago;
import com.style.beauty.ms_pagos.enums.EstadoTransaccion;
import com.style.beauty.ms_pagos.repository.TransaccionPagoRepository;
import org.springframework.beans.factory.annotation.Value;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import cl.transbank.webpay.webpayplus.WebpayPlus;
import cl.transbank.webpay.webpayplus.responses.WebpayPlusTransactionCommitResponse;
import cl.transbank.webpay.webpayplus.responses.WebpayPlusTransactionCreateResponse;

@Service
@RequiredArgsConstructor
public class WebpayService {
    private final TransaccionPagoRepository transaccionPagoRepository;
    private final AgendaClient agendaClient;
    private final CatalogoClient catalogoClient;

    @Value("${tbk.commerce-code}")
    private String commerceCode;

    @Value("${tbk.api-key}")
    private String apiKey;

    @Value("${tbk.return-url}")
    private String returnUrl;

    public CrearTransaccionResponse crearTransaccion(CrearTransaccionRequest request) {

        CitaResumen cita = agendaClient.obtenerCita(request.idCita());
        if (cita == null || cita.idCliente() == null || cita.idServicio() == null) {
            throw new IllegalStateException("No se pudo obtener la cita o sus datos de pago");
        }

        ServicioCatalogoResumen servicio = catalogoClient.obtenerServicio(cita.idServicio());
        BigDecimal monto = obtenerMontoServicio(servicio);

        String buyOrder = generarBuyOrder();
        String sessionId = cita.idCliente().toString();

        try {
            WebpayPlus.Transaction transaction =
                    WebpayPlus.Transaction.buildForIntegration(commerceCode, apiKey);

            WebpayPlusTransactionCreateResponse response = transaction.create(
                    buyOrder,
                    sessionId,
                    monto.doubleValue(),
                    returnUrl
            );

            TransaccionPago transaccion = TransaccionPago.builder()
                    .idCita(cita.idCita())
                    .idCliente(cita.idCliente())
                    .monto(monto)
                    .buyOrder(buyOrder)
                    .sessionId(sessionId)
                    .tokenWebpay(response.getToken())
                    .estado(EstadoTransaccion.PENDIENTE)
                    .build();

            TransaccionPago guardada = transaccionPagoRepository.save(transaccion);

            return new CrearTransaccionResponse(
                    guardada.getIdTransaccion(),
                    guardada.getIdCita(),
                    response.getToken(),
                    response.getUrl()
            );

        } catch (Exception e) {
            throw new RuntimeException("No se pudo crear la transacción Webpay: " + e.getMessage(), e);
        }
    }

    public TransaccionPago confirmarPago(String tokenWs) {

        TransaccionPago transaccion = transaccionPagoRepository.findByTokenWebpay(tokenWs)
                .orElseThrow(() -> new RuntimeException("Transacción no encontrada para token Webpay"));

        try {
            WebpayPlus.Transaction transaction =
                    WebpayPlus.Transaction.buildForIntegration(commerceCode, apiKey);

            WebpayPlusTransactionCommitResponse response = transaction.commit(tokenWs);

            transaccion.setAuthorizationCode(response.getAuthorizationCode());
            transaccion.setPaymentTypeCode(response.getPaymentTypeCode());
            transaccion.setResponseCode((int) response.getResponseCode());
            transaccion.setTransactionDate(OffsetDateTime.now());

            boolean pagoAprobado = response.getResponseCode() == 0
                    && "AUTHORIZED".equalsIgnoreCase(response.getStatus());

            if (pagoAprobado) {
                transaccion.setEstado(EstadoTransaccion.AUTORIZADA);
                TransaccionPago actualizada = transaccionPagoRepository.save(transaccion);

                agendaClient.confirmarCita(
                        actualizada.getIdCita(),
                        actualizada.getIdTransaccion()
                );

                return actualizada;
            }

            transaccion.setEstado(EstadoTransaccion.RECHAZADA);
            TransaccionPago actualizada = transaccionPagoRepository.save(transaccion);

            agendaClient.rechazarCita(
                    actualizada.getIdCita(),
                    "Pago Webpay rechazado"
            );

            return actualizada;

        } catch (Exception e) {
            transaccion.setEstado(EstadoTransaccion.ERROR);
            transaccionPagoRepository.save(transaccion);

            agendaClient.rechazarCita(
                    transaccion.getIdCita(),
                    "Error al confirmar pago Webpay"
            );

            throw new RuntimeException("No se pudo confirmar el pago Webpay: " + e.getMessage(), e);
        }
    }

    public TransaccionPago marcarComoExpiradaPorAborto(String buyOrder) {

        TransaccionPago transaccion = transaccionPagoRepository.findByBuyOrder(buyOrder)
                .orElseThrow(() -> new RuntimeException("Transacción no encontrada para buyOrder"));

        transaccion.setEstado(EstadoTransaccion.EXPIRADA);

        TransaccionPago actualizada = transaccionPagoRepository.save(transaccion);

        agendaClient.expirarCita(
                actualizada.getIdCita(),
                "Pago Webpay expirado o abortado"
        );

        return actualizada;
    }

    private String generarBuyOrder() {
        return "SB-" + System.currentTimeMillis();
    }

    private BigDecimal obtenerMontoServicio(ServicioCatalogoResumen servicio) {
        if (servicio == null || servicio.precioTotal() == null || servicio.precioTotal().signum() <= 0) {
            throw new IllegalStateException("El servicio no tiene un precio total valido");
        }

        return servicio.precioTotal();
    }
}
