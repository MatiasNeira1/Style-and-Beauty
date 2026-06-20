package com.style.beauty.ms_pagos.service;

import cl.transbank.webpay.webpayplus.WebpayPlus;
import cl.transbank.webpay.webpayplus.responses.WebpayPlusTransactionCommitResponse;
import cl.transbank.webpay.webpayplus.responses.WebpayPlusTransactionCreateResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.style.beauty.ms_pagos.client.AgendaClient;
import com.style.beauty.ms_pagos.client.CatalogoClient;
import com.style.beauty.ms_pagos.client.PerfilClient;
import com.style.beauty.ms_pagos.dto.CitaResumen;
import com.style.beauty.ms_pagos.dto.CrearTransaccionRequest;
import com.style.beauty.ms_pagos.dto.CrearTransaccionResponse;
import com.style.beauty.ms_pagos.entity.TransaccionPago;
import com.style.beauty.ms_pagos.enums.EstadoTransaccion;
import com.style.beauty.ms_pagos.exception.PagosValidationException;
import com.style.beauty.ms_pagos.repository.TransaccionPagoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebpayService {
    private static final String SIMULATED_TOKEN_PREFIX = "SIM-";
    private static final BigDecimal ABONO_RESERVA_CLP = BigDecimal.valueOf(10_000);
    private static final DateTimeFormatter WEBPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter WEBPAY_TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");
    private static final String DEFAULT_PUBLIC_GATEWAY_URL =
            "https://sb-gateway.bluerock-c41dfa74.brazilsouth.azurecontainerapps.io";

    private final TransaccionPagoRepository transaccionPagoRepository;
    private final AgendaClient agendaClient;
    private final CatalogoClient catalogoClient;
    private final PerfilClient perfilClient;
    private final ObjectMapper objectMapper;

    @Value("${tbk.commerce-code}")
    private String commerceCode;

    @Value("${tbk.api-key}")
    private String apiKey;

    @Value("${tbk.return-url}")
    private String returnUrl;

    @Value("${public.gateway-url:" + DEFAULT_PUBLIC_GATEWAY_URL + "}")
    private String publicGatewayUrl;

    @Value("${webpay.real-enabled:false}")
    private boolean webpayRealEnabled;

    public CrearTransaccionResponse crearTransaccion(CrearTransaccionRequest request) {
        logPayloadSeguro(request);
        validarPayloadInicial(request);
        List<UUID> idsCitas = idsCitas(request);
        List<CitaResumen> citas = obtenerCitasParaPago(idsCitas);

        validarCitasPendientes(citas);
        validarProductos(request.productos());

        CitaResumen primeraCita = citas.isEmpty() ? null : citas.get(0);
        UUID idCliente = resolverCliente(request, citas);
        boolean usarWebpaySimulado = debeUsarWebpaySimulado();
        TransaccionPago pendiente = buscarTransaccionPendienteReutilizable(idsCitas);

        if (pendiente != null && pendiente.getTokenWebpay() != null && pendiente.getUrlWebpay() != null) {
            if (usarWebpaySimulado) {
                pendiente = asegurarPendienteSimulada(pendiente);
            }
            return new CrearTransaccionResponse(
                    pendiente.getIdTransaccion(),
                    pendiente.getIdCita(),
                    pendiente.getTokenWebpay(),
                    pendiente.getUrlWebpay()
            );
        }

        BigDecimal monto = calcularMonto(citas, request.productos());
        registrarDiferenciaTotalInformado(request.total(), monto);
        String buyOrder = generarBuyOrder();
        String sessionId = idCliente.toString();

        if (usarWebpaySimulado) {
            return crearTransaccionSimulada(request, idsCitas, primeraCita, idCliente, monto, buyOrder, sessionId);
        }

        try {
            validarUrlPublica(returnUrl, "PUBLIC_GATEWAY_URL");
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
            log.warn("Webpay real no disponible; se usara simulacion controlada. causa={}", e.getMessage());
            return crearTransaccionSimulada(request, idsCitas, primeraCita, idCliente, monto, buyOrder, sessionId);
        }
    }

    public TransaccionPago confirmarPago(String tokenWs) {
        if (esTokenSimulado(tokenWs)) {
            return confirmarPagoSimulado(tokenWs);
        }

        TransaccionPago transaccion = transaccionPagoRepository.findByTokenWebpay(tokenWs)
                .orElseThrow(() -> new RuntimeException("Transacción no encontrada para token Webpay"));

        if (transaccion.getEstado() == EstadoTransaccion.AUTORIZADA) {
            return transaccion;
        }

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
                acumularPuntosFidelidad(actualizada);
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

    public TransaccionPago confirmarPagoSimulado(UUID idTransaccion, String tokenWs) {
        TransaccionPago transaccion = buscarTransaccion(idTransaccion);
        validarTokenSimulado(transaccion, tokenWs);
        return autorizarPagoSimulado(transaccion);
    }

    public TransaccionPago rechazarPagoSimulado(UUID idTransaccion, String tokenWs) {
        TransaccionPago transaccion = buscarTransaccion(idTransaccion);
        validarTokenSimulado(transaccion, tokenWs);

        if (transaccion.getEstado() == EstadoTransaccion.AUTORIZADA) {
            return transaccion;
        }

        if (transaccion.getEstado() != EstadoTransaccion.PENDIENTE
                && transaccion.getEstado() != EstadoTransaccion.CREADA) {
            return transaccion;
        }

        transaccion.setEstado(EstadoTransaccion.RECHAZADA);
        transaccion.setAuthorizationCode("SIMULATED_REJECTED");
        transaccion.setPaymentTypeCode("SIM");
        transaccion.setResponseCode(-1);
        transaccion.setTransactionDate(OffsetDateTime.now());

        TransaccionPago actualizada = transaccionPagoRepository.save(transaccion);
        idsCitas(actualizada).forEach((idCita) ->
                agendaClient.rechazarCita(idCita, "Pago Webpay simulado rechazado"));
        return actualizada;
    }

    public TransaccionPago confirmarPagoSimulado(String tokenWs) {
        TransaccionPago transaccion = transaccionPagoRepository.findByTokenWebpay(tokenWs)
                .orElseThrow(() -> new RuntimeException("Transaccion simulada no encontrada"));
        return autorizarPagoSimulado(transaccion);
    }

    public String construirHtmlPagoSimulado(UUID idTransaccion, String tokenWs) {
        TransaccionPago transaccion = buscarTransaccion(idTransaccion);
        validarTokenSimulado(transaccion, tokenWs);

        if (transaccion.getEstado() == EstadoTransaccion.AUTORIZADA) {
            return paginaSimple("Pago ya confirmado", "Esta transaccion simulada ya fue confirmada correctamente.");
        }

        if (transaccion.getEstado() == EstadoTransaccion.RECHAZADA
                || transaccion.getEstado() == EstadoTransaccion.ERROR
                || transaccion.getEstado() == EstadoTransaccion.EXPIRADA) {
            return paginaSimple("Pago no disponible", "Esta transaccion simulada ya no se encuentra disponible.");
        }

        String token = transaccion.getTokenWebpay();
        String resumenReservas = construirResumenReservasSimulado(transaccion);
        return """
                <!doctype html>
                <html lang="es">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>WebPay simulado</title>
                  <style>
                    body { font-family: Arial, sans-serif; background: #f7f1ed; margin: 0; min-height: 100vh; display: grid; place-items: center; color: #2d2420; }
                    main { width: min(520px, calc(100vw - 32px)); background: #fff; border: 1px solid #e5d8d1; border-radius: 8px; padding: 28px; box-shadow: 0 18px 50px rgba(45, 36, 32, .12); }
                    h1 { margin: 0 0 8px; font-size: 26px; }
                    p { line-height: 1.5; }
                    dl { display: grid; gap: 10px; margin: 22px 0; }
                    div { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #eee5df; padding-bottom: 8px; }
                    dt { color: #6d5c54; }
                    dd { margin: 0; font-weight: 700; text-align: right; }
                    .reservation-list { display: grid; gap: 10px; margin: 18px 0 22px; padding: 0; list-style: none; }
                    .reservation-list li { border: 1px solid #eee5df; border-radius: 6px; padding: 10px 12px; }
                    .reservation-list strong, .reservation-list span { display: block; }
                    .reservation-list span { color: #6d5c54; font-size: 13px; line-height: 1.45; margin-top: 3px; }
                    .actions { display: flex; gap: 12px; flex-wrap: wrap; border: 0; padding: 0; }
                    button { border: 0; border-radius: 6px; padding: 12px 16px; font-weight: 700; cursor: pointer; }
                    .confirm { background: #2d2420; color: #fff; }
                    .reject { background: #efe5df; color: #2d2420; }
                  </style>
                </head>
                <body>
                  <main>
                    <h1>WebPay simulado</h1>
                    <p>Ambiente de prueba para confirmar el pago sin credenciales reales de Transbank.</p>
                    <dl>
                      <div><dt>Orden</dt><dd>%s</dd></div>
                      <div><dt>Total a abonar hoy</dt><dd>%s</dd></div>
                      <div><dt>Reservas</dt><dd>%s</dd></div>
                    </dl>
                    %s
                    <div class="actions">
                      <form method="POST" action="/api/pagos/webpay/simulado/%s/confirmar">
                        <input type="hidden" name="token_ws" value="%s">
                        <button class="confirm" type="submit">Confirmar pago simulado</button>
                      </form>
                      <form method="POST" action="/api/pagos/webpay/simulado/%s/rechazar">
                        <input type="hidden" name="token_ws" value="%s">
                        <button class="reject" type="submit">Rechazar</button>
                      </form>
                    </div>
                  </main>
                </body>
                </html>
                """.formatted(
                escapeHtml(transaccion.getBuyOrder()),
                escapeHtml(formatearClp(transaccion.getMonto())),
                idsCitas(transaccion).size(),
                resumenReservas,
                transaccion.getIdTransaccion(),
                escapeHtml(token),
                transaccion.getIdTransaccion(),
                escapeHtml(token)
        );
    }

    private String construirResumenReservasSimulado(TransaccionPago transaccion) {
        CrearTransaccionRequest detalle = leerDetalleItems(transaccion);
        if (detalle == null || detalle.reservas() == null || detalle.reservas().isEmpty()) {
            return "<p>No hay reservas asociadas a esta orden.</p>";
        }

        String items = detalle.reservas().stream()
                .map(this::reservaSimuladaHtml)
                .collect(Collectors.joining());
        return "<ul class=\"reservation-list\">" + items + "</ul>";
    }

    private String reservaSimuladaHtml(CrearTransaccionRequest.ReservaCarrito reserva) {
        String servicio = escapeHtml(isBlank(reserva.servicioNombre()) ? "Servicio" : reserva.servicioNombre());
        String profesional = escapeHtml(isBlank(reserva.profesionalNombre()) ? "Profesional" : reserva.profesionalNombre());
        String fecha = escapeHtml(formatearFechaReserva(reserva));
        String horario = escapeHtml(formatearHorarioReserva(reserva));
        String precio = escapeHtml(formatearClp(reserva.precio()));
        String abono = escapeHtml(formatearClp(ABONO_RESERVA_CLP));

        return """
                <li>
                  <strong>%s</strong>
                  <span>%s</span>
                  <span>%s · %s</span>
                  <span>Valor del servicio: %s</span>
                  <span>Abono WebPay: %s</span>
                </li>
                """.formatted(servicio, profesional, fecha, horario, precio, abono);
    }

    private CrearTransaccionRequest leerDetalleItems(TransaccionPago transaccion) {
        if (transaccion.getDetalleItemsJson() == null || transaccion.getDetalleItemsJson().isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(transaccion.getDetalleItemsJson(), CrearTransaccionRequest.class);
        } catch (JsonProcessingException e) {
            log.warn("No se pudo leer detalle de items para Webpay simulado: idTransaccion={}", transaccion.getIdTransaccion());
            return null;
        }
    }

    private String formatearFechaReserva(CrearTransaccionRequest.ReservaCarrito reserva) {
        if (reserva.horaInicio() != null) {
            return reserva.horaInicio().format(WEBPAY_DATE_FORMAT);
        }
        return isBlank(reserva.fecha()) ? "Fecha por confirmar" : reserva.fecha();
    }

    private String formatearHorarioReserva(CrearTransaccionRequest.ReservaCarrito reserva) {
        if (reserva.horaInicio() == null) {
            return "Hora por confirmar";
        }
        String inicio = reserva.horaInicio().format(WEBPAY_TIME_FORMAT);
        String fin = reserva.horaFin() == null ? "" : reserva.horaFin().format(WEBPAY_TIME_FORMAT);
        return fin.isBlank() ? inicio : inicio + " - " + fin;
    }

    private CrearTransaccionResponse crearTransaccionSimulada(
            CrearTransaccionRequest request,
            List<UUID> idsCitas,
            CitaResumen primeraCita,
            UUID idCliente,
            BigDecimal monto,
            String buyOrder,
            String sessionId
    ) {
        String token = SIMULATED_TOKEN_PREFIX + UUID.randomUUID();
        TransaccionPago transaccion = TransaccionPago.builder()
                .idCita(primeraCita == null ? null : primeraCita.idCita())
                .idCitas(serializarIds(idsCitas))
                .idCliente(idCliente)
                .monto(monto)
                .buyOrder(buyOrder)
                .sessionId(sessionId)
                .tokenWebpay(token)
                .detalleItemsJson(serializarDetalle(request))
                .estado(EstadoTransaccion.PENDIENTE)
                .build();

        TransaccionPago guardada = transaccionPagoRepository.save(transaccion);
        guardada.setUrlWebpay(construirUrlPagoSimulado(guardada.getIdTransaccion()));
        guardada = transaccionPagoRepository.save(guardada);

        log.info(
                "Webpay simulado creado: idTransaccion={} reservas={} productos={} monto={}",
                guardada.getIdTransaccion(),
                idsCitas.size(),
                request.productos() == null ? 0 : request.productos().size(),
                monto
        );

        return new CrearTransaccionResponse(
                guardada.getIdTransaccion(),
                guardada.getIdCita(),
                guardada.getTokenWebpay(),
                guardada.getUrlWebpay()
        );
    }

    private TransaccionPago asegurarPendienteSimulada(TransaccionPago transaccion) {
        if (esTokenSimulado(transaccion.getTokenWebpay()) && esUrlPagoSimulado(transaccion.getUrlWebpay())) {
            return transaccion;
        }

        transaccion.setTokenWebpay(SIMULATED_TOKEN_PREFIX + UUID.randomUUID());
        transaccion.setUrlWebpay(construirUrlPagoSimulado(transaccion.getIdTransaccion()));
        transaccion.setEstado(EstadoTransaccion.PENDIENTE);

        TransaccionPago actualizada = transaccionPagoRepository.save(transaccion);
        log.info("Transaccion pendiente convertida a Webpay simulado: idTransaccion={}", actualizada.getIdTransaccion());
        return actualizada;
    }

    private TransaccionPago autorizarPagoSimulado(TransaccionPago transaccion) {
        if (transaccion.getEstado() == EstadoTransaccion.AUTORIZADA) {
            return transaccion;
        }

        if (transaccion.getEstado() != EstadoTransaccion.PENDIENTE
                && transaccion.getEstado() != EstadoTransaccion.CREADA) {
            throw new IllegalStateException("La transaccion simulada ya no se puede confirmar");
        }

        transaccion.setAuthorizationCode("SIMULATED_OK");
        transaccion.setPaymentTypeCode("SIM");
        transaccion.setResponseCode(0);
        transaccion.setTransactionDate(OffsetDateTime.now());
        transaccion.setEstado(EstadoTransaccion.AUTORIZADA);

        TransaccionPago actualizada = transaccionPagoRepository.save(transaccion);
        idsCitas(actualizada).forEach((idCita) ->
                agendaClient.confirmarCita(idCita, actualizada.getIdTransaccion()));
        acumularPuntosFidelidad(actualizada);
        return actualizada;
    }

    private void acumularPuntosFidelidad(TransaccionPago transaccion) {
        List<UUID> reservas = idsCitas(transaccion);
        if (transaccion.getIdCliente() == null || reservas.isEmpty()) {
            return;
        }

        int puntos = reservas.size();
        try {
            perfilClient.acumularPuntosFidelidad(transaccion.getIdCliente(), puntos);
            log.info(
                    "Puntos de fidelidad acumulados: idCliente={} puntos={} idTransaccion={}",
                    transaccion.getIdCliente(),
                    puntos,
                    transaccion.getIdTransaccion()
            );
        } catch (Exception e) {
            log.warn(
                    "No se pudieron acumular puntos de fidelidad: idCliente={} puntos={} idTransaccion={} causa={}",
                    transaccion.getIdCliente(),
                    puntos,
                    transaccion.getIdTransaccion(),
                    e.getMessage()
            );
        }
    }

    private void validarTokenSimulado(TransaccionPago transaccion, String tokenWs) {
        if (tokenWs == null || tokenWs.isBlank()) {
            return;
        }
        if (!Objects.equals(transaccion.getTokenWebpay(), tokenWs)) {
            throw new IllegalStateException("Token de pago simulado invalido");
        }
    }

    private boolean esTokenSimulado(String tokenWs) {
        return tokenWs != null && tokenWs.startsWith(SIMULATED_TOKEN_PREFIX);
    }

    private boolean esUrlPagoSimulado(String url) {
        return url != null && url.contains("/api/pagos/webpay/simulado/");
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
                fail("No se pudo obtener la cita o sus datos de pago", "reservas", "RESERVATION_NOT_FOUND");
            }
            if (!"PENDIENTE_PAGO".equalsIgnoreCase(cita.estadoCita())) {
                fail("Solo se puede crear pago para reservas pendientes de pago", "reservas.estadoCita", "RESERVATION_NOT_PAYABLE");
            }
        }
    }

    private void validarProductos(List<CrearTransaccionRequest.ProductoCarrito> productos) {
        if (productos == null) {
            return;
        }
        productos.forEach((producto) -> {
            if (producto == null) {
                fail("El carrito contiene un producto invalido.", "productos");
            }
            if (producto.idProducto() == null || producto.idProducto().isBlank()) {
                fail("El carrito contiene un producto sin identificador.", "productos.idProducto");
            }
            if (producto.precio() == null || producto.precio().signum() <= 0) {
                fail("El carrito contiene un producto sin precio valido.", "productos.precio");
            }
            if (producto.cantidad() == null || producto.cantidad() <= 0) {
                fail("El carrito contiene un producto sin cantidad valida.", "productos.cantidad");
            }
        });
    }

    private UUID resolverCliente(CrearTransaccionRequest request, List<CitaResumen> citas) {
        if (!citas.isEmpty()) {
            UUID idCliente = citas.get(0).idCliente();
            boolean mismoCliente = citas.stream().allMatch((cita) -> idCliente.equals(cita.idCliente()));
            if (!mismoCliente) {
                fail("Todas las reservas del carrito deben pertenecer al mismo cliente.", "reservas.idCliente");
            }
            return idCliente;
        }
        if (request.idCliente() == null) {
            fail("No fue posible identificar al cliente para pagar el carrito.", "idCliente");
        }
        return request.idCliente();
    }

    private BigDecimal calcularMonto(
            List<CitaResumen> citas,
            List<CrearTransaccionRequest.ProductoCarrito> productos
    ) {
        BigDecimal montoReservas = ABONO_RESERVA_CLP.multiply(BigDecimal.valueOf(citas.size()));

        BigDecimal montoProductos = productos == null ? BigDecimal.ZERO : productos.stream()
                .map((producto) -> producto.precio().multiply(BigDecimal.valueOf(producto.cantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal total = montoReservas.add(montoProductos);
        if (total.signum() <= 0) {
            fail("El carrito no tiene monto a pagar.", "total");
        }
        return total;
    }

    private List<CitaResumen> obtenerCitasParaPago(List<UUID> idsCitas) {
        List<CitaResumen> citas = new ArrayList<>();
        for (int i = 0; i < idsCitas.size(); i++) {
            UUID idCita = idsCitas.get(i);
            try {
                citas.add(agendaClient.obtenerCita(idCita));
            } catch (RestClientResponseException e) {
                fail("No se pudo obtener la reserva del carrito.", "reservas[" + i + "].idCita");
            } catch (RestClientException e) {
                log.warn("No se pudo consultar ms-agenda para preparar Webpay: idCita={} causa={}", idCita, e.getMessage());
                fail(
                        "Agenda temporalmente no disponible para validar la reserva. Intenta nuevamente.",
                        "reservas[" + i + "].idCita",
                        "AGENDA_SERVICE_UNAVAILABLE"
                );
            }
        }
        return citas;
    }

    private void validarPayloadInicial(CrearTransaccionRequest request) {
        if (request == null) {
            fail("El payload de pago es obligatorio.", "body");
        }

        boolean tieneIdCitaLegacy = request.idCita() != null;
        boolean tieneReservas = request.reservas() != null && !request.reservas().isEmpty();
        boolean tieneProductos = request.productos() != null && !request.productos().isEmpty();

        if (!tieneIdCitaLegacy && !tieneReservas && !tieneProductos) {
            fail("El carrito no contiene reservas ni productos para pagar.", "items");
        }

        if (request.reservas() != null) {
            for (int i = 0; i < request.reservas().size(); i++) {
                CrearTransaccionRequest.ReservaCarrito reserva = request.reservas().get(i);
                if (reserva == null || reserva.idCita() == null) {
                    fail("Falta idCita en item reserva.", "reservas[" + i + "].idCita");
                }
                if (reserva.servicioId() == null) {
                    fail("Falta servicioId en item reserva.", "reservas[" + i + "].servicioId");
                }
                if (reserva.profesionalId() == null) {
                    fail("Falta profesionalId en item reserva.", "reservas[" + i + "].profesionalId");
                }
                if (reserva.fecha() == null || reserva.fecha().isBlank()) {
                    fail("Falta fecha en item reserva.", "reservas[" + i + "].fecha");
                }
                if (reserva.horaInicio() == null) {
                    fail("Falta horaInicio en item reserva.", "reservas[" + i + "].horaInicio");
                }
                if (reserva.precio() == null || reserva.precio().signum() <= 0) {
                    fail("Falta precio valido en item reserva.", "reservas[" + i + "].precio");
                }
            }
        }

        validarProductos(request.productos());
    }

    private void logPayloadSeguro(CrearTransaccionRequest request) {
        if (request == null) {
            log.warn("Payload Webpay recibido: body=null");
            return;
        }
        List<UUID> idsReservas = idsCitas(request);
        int reservasCount = request.reservas() == null ? 0 : request.reservas().size();
        int productosCount = request.productos() == null ? 0 : request.productos().size();
        log.info(
                "Payload Webpay recibido: idCliente={} reservas={} productos={} total={} idsCitas={}",
                request.idCliente(),
                reservasCount,
                productosCount,
                request.total(),
                idsReservas
        );
    }

    private void registrarDiferenciaTotalInformado(BigDecimal totalInformado, BigDecimal totalCalculado) {
        if (totalInformado == null) {
            return;
        }
        if (totalInformado.compareTo(totalCalculado) != 0) {
            log.warn(
                    "Total Webpay informado difiere del calculado: informado={} calculado={}",
                    totalInformado,
                    totalCalculado
            );
        }
    }

    private void fail(String message, String field, String code) {
        log.warn("Payload Webpay invalido: code={} field={} message={}", code, field, message);
        throw new PagosValidationException(message, field, code);
    }

    private void fail(String message, String field) {
        fail(message, field, "PAYMENT_PAYLOAD_INVALID");
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

    private boolean debeUsarWebpaySimulado() {
        if (!webpayRealEnabled) {
            log.info("Webpay real deshabilitado; se usara modo simulado.");
            return true;
        }
        if (isBlank(commerceCode) || isBlank(apiKey)) {
            log.warn("Credenciales Transbank incompletas; se usara modo simulado.");
            return true;
        }
        if (!esUrlPublica(returnUrl)) {
            log.warn("Return URL Webpay no publica; se usara modo simulado. returnUrl={}", returnUrl);
            return true;
        }
        return false;
    }

    private String construirUrlPagoSimulado(UUID idTransaccion) {
        return normalizarBasePublica(publicGatewayUrl)
                + "/api/pagos/webpay/simulado/"
                + idTransaccion;
    }

    private String normalizarBasePublica(String url) {
        if (isBlank(url) || url.toLowerCase().contains(".internal.")) {
            return DEFAULT_PUBLIC_GATEWAY_URL;
        }
        String normalizada = url.trim().replaceAll("/+$", "");
        if (normalizada.toLowerCase().endsWith("/api/pagos/webpay/retorno")) {
            return normalizada.substring(0, normalizada.length() - "/api/pagos/webpay/retorno".length());
        }
        if (normalizada.toLowerCase().endsWith("/api/pagos/webpay")) {
            return normalizada.substring(0, normalizada.length() - "/api/pagos/webpay".length());
        }
        if (normalizada.toLowerCase().endsWith("/api")) {
            return normalizada.substring(0, normalizada.length() - 4);
        }
        return normalizada;
    }

    private void validarUrlPublica(String url, String envName) {
        if (isBlank(url)) {
            throw new IllegalStateException(envName + " debe configurar una URL publica para WebPay");
        }
        if (!esUrlPublica(url)) {
            throw new IllegalStateException(envName + " no puede apuntar a una URL interna");
        }
    }

    private boolean esUrlPublica(String url) {
        if (isBlank(url)) {
            return false;
        }
        String normalizada = url.trim().toLowerCase();
        return normalizada.startsWith("https://") && !normalizada.contains(".internal.");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String formatearClp(BigDecimal value) {
        BigDecimal safeValue = value == null ? BigDecimal.ZERO : value;
        NumberFormat formatter = NumberFormat.getIntegerInstance(new Locale("es", "CL"));
        return "$" + formatter.format(safeValue.setScale(0, RoundingMode.HALF_UP));
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
