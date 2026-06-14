package com.style.beauty.ms_pagos.service;

import cl.transbank.webpay.webpayplus.WebpayPlus;
import cl.transbank.webpay.webpayplus.responses.WebpayPlusTransactionCommitResponse;
import cl.transbank.webpay.webpayplus.responses.WebpayPlusTransactionCreateResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.style.beauty.ms_pagos.client.AgendaClient;
import com.style.beauty.ms_pagos.client.CatalogoClient;
import com.style.beauty.ms_pagos.dto.CitaResumen;
import com.style.beauty.ms_pagos.dto.CrearTransaccionRequest;
import com.style.beauty.ms_pagos.dto.CrearTransaccionResponse;
import com.style.beauty.ms_pagos.dto.ServicioCatalogoResumen;
import com.style.beauty.ms_pagos.entity.TransaccionPago;
import com.style.beauty.ms_pagos.enums.EstadoTransaccion;
import com.style.beauty.ms_pagos.repository.TransaccionPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WebpayService {
    private final TransaccionPagoRepository transaccionPagoRepository;
    private final AgendaClient agendaClient;
    private final CatalogoClient catalogoClient;
    private final ObjectMapper objectMapper;

    @Value("${tbk.commerce-code}")
    private String commerceCode;

    @Value("${tbk.api-key}")
    private String apiKey;

    @Value("${tbk.return-url}")
    private String returnUrl;

    public CrearTransaccionResponse crearTransaccion(CrearTransaccionRequest request) {
        List<UUID> idsCitas = idsCitas(request);
        List<CitaResumen> citas = idsCitas.stream()
                .map(agendaClient::obtenerCita)
                .toList();

        validarCitasPendientes(citas);
        validarProductos(request.productos());

        CitaResumen primeraCita = citas.isEmpty() ? null : citas.get(0);
        UUID idCliente = resolverCliente(request, citas);
        TransaccionPago pendiente = buscarTransaccionPendienteReutilizable(idsCitas);

        if (pendiente != null && pendiente.getTokenWebpay() != null && pendiente.getUrlWebpay() != null) {
            return new CrearTransaccionResponse(
                    pendiente.getIdTransaccion(),
                    pendiente.getIdCita(),
                    pendiente.getTokenWebpay(),
                    pendiente.getUrlWebpay()
            );
        }

        BigDecimal monto = calcularMonto(citas, request.productos());
        String buyOrder = generarBuyOrder();
        String sessionId = idCliente.toString();
        validarUrlPublica(returnUrl, "PUBLIC_GATEWAY_URL");

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
                    .idCita(primeraCita == null ? null : primeraCita.idCita())
                    .idCitas(serializarIds(idsCitas))
                    .idCliente(idCliente)
                    .monto(monto)
                    .buyOrder(buyOrder)
                    .sessionId(sessionId)
                    .tokenWebpay(response.getToken())
                    .urlWebpay(response.getUrl())
                    .detalleItemsJson(serializarDetalle(request))
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
                idsCitas(actualizada).forEach((idCita) ->
                        agendaClient.confirmarCita(idCita, actualizada.getIdTransaccion()));
                return actualizada;
            }

            transaccion.setEstado(EstadoTransaccion.RECHAZADA);
            TransaccionPago actualizada = transaccionPagoRepository.save(transaccion);
            idsCitas(actualizada).forEach((idCita) ->
                    agendaClient.rechazarCita(idCita, "Pago Webpay rechazado"));
            return actualizada;

        } catch (Exception e) {
            transaccion.setEstado(EstadoTransaccion.ERROR);
            transaccionPagoRepository.save(transaccion);
            idsCitas(transaccion).forEach((idCita) ->
                    agendaClient.rechazarCita(idCita, "Error al confirmar pago Webpay"));
            throw new RuntimeException("No se pudo confirmar el pago Webpay: " + e.getMessage(), e);
        }
    }

    public TransaccionPago marcarComoExpiradaPorAborto(String buyOrder) {
        TransaccionPago transaccion = transaccionPagoRepository.findByBuyOrder(buyOrder)
                .orElseThrow(() -> new RuntimeException("Transacción no encontrada para buyOrder"));

        transaccion.setEstado(EstadoTransaccion.EXPIRADA);
        TransaccionPago actualizada = transaccionPagoRepository.save(transaccion);
        idsCitas(actualizada).forEach((idCita) ->
                agendaClient.expirarCita(idCita, "Pago Webpay expirado o abortado"));
        return actualizada;
    }

    public TransaccionPago buscarTransaccion(UUID idTransaccion) {
        return transaccionPagoRepository.findById(idTransaccion)
                .orElseThrow(() -> new IllegalStateException("Transaccion no encontrada"));
    }

    public String construirHtmlRedireccion(UUID idTransaccion) {
        TransaccionPago transaccion = buscarTransaccion(idTransaccion);

        if (transaccion.getEstado() == EstadoTransaccion.AUTORIZADA) {
            return paginaSimple("Pago ya realizado", "Este carrito ya fue pagado correctamente.");
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

    private List<UUID> idsCitas(CrearTransaccionRequest request) {
        LinkedHashSet<UUID> ids = new LinkedHashSet<>();
        if (request.idCita() != null) {
            ids.add(request.idCita());
        }
        if (request.reservas() != null) {
            request.reservas().stream()
                    .map(CrearTransaccionRequest.ReservaCarrito::idCita)
                    .filter(Objects::nonNull)
                    .forEach(ids::add);
        }
        return new ArrayList<>(ids);
    }

    private List<UUID> idsCitas(TransaccionPago transaccion) {
        if (transaccion.getIdCitas() == null || transaccion.getIdCitas().isBlank()) {
            return transaccion.getIdCita() == null ? List.of() : List.of(transaccion.getIdCita());
        }

        return List.of(transaccion.getIdCitas().split(",")).stream()
                .map(String::trim)
                .filter((value) -> !value.isBlank())
                .map(UUID::fromString)
                .toList();
    }

    private void validarCitasPendientes(List<CitaResumen> citas) {
        for (CitaResumen cita : citas) {
            if (cita == null || cita.idCliente() == null || cita.idServicio() == null) {
                throw new IllegalStateException("No se pudo obtener la cita o sus datos de pago");
            }
            if (!"PENDIENTE_PAGO".equalsIgnoreCase(cita.estadoCita())) {
                throw new IllegalStateException("Solo se puede crear pago para reservas pendientes de pago");
            }
        }
    }

    private void validarProductos(List<CrearTransaccionRequest.ProductoCarrito> productos) {
        if (productos == null) {
            return;
        }
        productos.forEach((producto) -> {
            if (producto.idProducto() == null || producto.precio() == null || producto.precio().signum() <= 0) {
                throw new IllegalStateException("El carrito contiene un producto sin precio valido");
            }
            if (producto.cantidad() == null || producto.cantidad() <= 0) {
                throw new IllegalStateException("El carrito contiene un producto sin cantidad valida");
            }
        });
    }

    private UUID resolverCliente(CrearTransaccionRequest request, List<CitaResumen> citas) {
        if (!citas.isEmpty()) {
            UUID idCliente = citas.get(0).idCliente();
            boolean mismoCliente = citas.stream().allMatch((cita) -> idCliente.equals(cita.idCliente()));
            if (!mismoCliente) {
                throw new IllegalStateException("Todas las reservas del carrito deben pertenecer al mismo cliente");
            }
            return idCliente;
        }
        if (request.idCliente() == null) {
            throw new IllegalStateException("No fue posible identificar al cliente para pagar el carrito");
        }
        return request.idCliente();
    }

    private BigDecimal calcularMonto(
            List<CitaResumen> citas,
            List<CrearTransaccionRequest.ProductoCarrito> productos
    ) {
        BigDecimal montoReservas = citas.stream()
                .map((cita) -> catalogoClient.obtenerServicio(cita.idServicio()))
                .map(this::obtenerMontoServicio)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal montoProductos = productos == null ? BigDecimal.ZERO : productos.stream()
                .map((producto) -> producto.precio().multiply(BigDecimal.valueOf(producto.cantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal total = montoReservas.add(montoProductos);
        if (total.signum() <= 0) {
            throw new IllegalStateException("El carrito no tiene monto a pagar");
        }
        return total;
    }

    private TransaccionPago buscarTransaccionPendienteReutilizable(List<UUID> idsCitas) {
        if (idsCitas.size() != 1) {
            return null;
        }
        return transaccionPagoRepository
                .findFirstByIdCitaAndEstadoInOrderByCreatedAtDesc(
                        idsCitas.get(0),
                        List.of(EstadoTransaccion.CREADA, EstadoTransaccion.PENDIENTE)
                )
                .orElse(null);
    }

    private String serializarIds(List<UUID> idsCitas) {
        return idsCitas.stream()
                .map(UUID::toString)
                .collect(Collectors.joining(","));
    }

    private String serializarDetalle(CrearTransaccionRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No fue posible guardar el detalle del carrito", e);
        }
    }

    private String generarBuyOrder() {
        return "SB-" + System.currentTimeMillis();
    }

    private void validarUrlPublica(String url, String envName) {
        if (url == null || url.isBlank()) {
            throw new IllegalStateException(envName + " debe configurar una URL publica para WebPay");
        }
        String normalizada = url.trim().toLowerCase();
        if (!normalizada.startsWith("https://") || normalizada.contains(".internal.")) {
            throw new IllegalStateException(envName + " no puede apuntar a una URL interna");
        }
    }

    private BigDecimal obtenerMontoServicio(ServicioCatalogoResumen servicio) {
        if (servicio == null || servicio.precioTotal() == null || servicio.precioTotal().signum() <= 0) {
            throw new IllegalStateException("El servicio no tiene un precio total valido");
        }

        return servicio.precioTotal();
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
