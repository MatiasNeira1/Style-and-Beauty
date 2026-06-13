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
import java.util.List;
import java.util.UUID;
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
        if (!"PENDIENTE_PAGO".equalsIgnoreCase(cita.estadoCita())) {
            throw new IllegalStateException("Solo se puede crear pago para una cita pendiente de pago");
        }

        TransaccionPago pendiente = transaccionPagoRepository
                .findFirstByIdCitaAndEstadoInOrderByCreatedAtDesc(
                        cita.idCita(),
                        List.of(EstadoTransaccion.CREADA, EstadoTransaccion.PENDIENTE)
                )
                .orElse(null);

        if (pendiente != null && pendiente.getTokenWebpay() != null && pendiente.getUrlWebpay() != null) {
            return new CrearTransaccionResponse(
                    pendiente.getIdTransaccion(),
                    pendiente.getIdCita(),
                    pendiente.getTokenWebpay(),
                    pendiente.getUrlWebpay()
            );
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
                    .urlWebpay(response.getUrl())
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

    public TransaccionPago buscarTransaccion(UUID idTransaccion) {
        return transaccionPagoRepository.findById(idTransaccion)
                .orElseThrow(() -> new IllegalStateException("Transaccion no encontrada"));
    }

    public String construirHtmlRedireccion(UUID idTransaccion) {
        TransaccionPago transaccion = buscarTransaccion(idTransaccion);

        if (transaccion.getEstado() == EstadoTransaccion.AUTORIZADA) {
            return paginaSimple("Pago ya realizado", "Esta reserva ya fue pagada correctamente.");
        }

        if (transaccion.getEstado() == EstadoTransaccion.RECHAZADA
                || transaccion.getEstado() == EstadoTransaccion.ERROR
                || transaccion.getEstado() == EstadoTransaccion.EXPIRADA) {
            return paginaSimple("Pago no disponible", "Este link de pago ya no se encuentra disponible.");
        }

        if (transaccion.getEstado() != EstadoTransaccion.PENDIENTE
                && transaccion.getEstado() != EstadoTransaccion.CREADA) {
            return paginaSimple("Pago no disponible", "Este link de pago no se encuentra disponible.");
        }

        if (transaccion.getTokenWebpay() == null || transaccion.getTokenWebpay().isBlank()
                || transaccion.getUrlWebpay() == null || transaccion.getUrlWebpay().isBlank()) {
            throw new IllegalStateException("La transaccion no tiene datos de redireccion Webpay");
        }

        return """
                <!doctype html>
                <html lang="es">
                <head>
                  <meta charset="utf-8">
                  <title>Redirigiendo a Webpay</title>
                </head>
                <body>
                  <p>Redirigiendo a Webpay...</p>
                  <form id="webpayForm" method="POST" action="%s">
                    <input type="hidden" name="token_ws" value="%s">
                  </form>
                  <script>
                    document.getElementById("webpayForm").submit();
                  </script>
                </body>
                </html>
                """.formatted(escapeHtml(transaccion.getUrlWebpay()), escapeHtml(transaccion.getTokenWebpay()));
    }

    private String paginaSimple(String titulo, String mensaje) {
        return """
                <!doctype html>
                <html lang="es">
                <head>
                  <meta charset="utf-8">
                  <title>%s</title>
                </head>
                <body>
                  <h1>%s</h1>
                  <p>%s</p>
                </body>
                </html>
                """.formatted(escapeHtml(titulo), escapeHtml(titulo), escapeHtml(mensaje));
    }

    private String escapeHtml(String value) {
        return value == null ? "" : value
                .replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
