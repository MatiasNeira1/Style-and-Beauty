package com.style.beauty.ms_pagos.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResourceAccessException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WebpayServiceTest {
    private static final UUID ID_CLIENTE = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID ID_SERVICIO = UUID.fromString("20000000-0000-4000-8000-000000000001");
    private static final UUID ID_STAFF = UUID.fromString("30000000-0000-4000-8000-000000000001");
    private static final OffsetDateTime HORA_INICIO = OffsetDateTime.parse("2030-01-07T09:00:00-03:00");

    private final TransaccionPagoRepository repository = mock(TransaccionPagoRepository.class);
    private final AgendaClient agendaClient = mock(AgendaClient.class);
    private final CatalogoClient catalogoClient = mock(CatalogoClient.class);
    private final PerfilClient perfilClient = mock(PerfilClient.class);
    private final WebpayService service = new WebpayService(repository, agendaClient, catalogoClient, perfilClient, objectMapper());

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "publicGatewayUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(service, "returnUrl", "http://localhost:8080/api/pagos/webpay/retorno");
        ReflectionTestUtils.setField(service, "webpayRealEnabled", false);

        when(repository.findFirstByIdCitaAndEstadoInOrderByCreatedAtDesc(any(), any())).thenReturn(Optional.empty());
        when(repository.save(any(TransaccionPago.class))).thenAnswer((invocation) -> {
            TransaccionPago transaccion = invocation.getArgument(0);
            if (transaccion.getIdTransaccion() == null) {
                transaccion.setIdTransaccion(UUID.randomUUID());
            }
            return transaccion;
        });
    }

    @Test
    void redireccionWebpayDevuelveHtmlConFormularioPostYTokenWs() {
        UUID idTransaccion = UUID.randomUUID();
        TransaccionPago transaccion = TransaccionPago.builder()
                .idTransaccion(idTransaccion)
                .idCliente(UUID.randomUUID())
                .tokenWebpay("token-test")
                .urlWebpay("https://webpay.test/transaction")
                .estado(EstadoTransaccion.PENDIENTE)
                .build();
        when(repository.findById(idTransaccion)).thenReturn(Optional.of(transaccion));

        String html = service.construirHtmlRedireccion(idTransaccion);

        assertThat(html).contains("method=\"POST\"");
        assertThat(html).contains("action=\"https://webpay.test/transaction\"");
        assertThat(html).contains("name=\"token_ws\"");
        assertThat(html).contains("value=\"token-test\"");
        assertThat(html).contains("submit()");
    }

    @Test
    void redireccionWebpayIndicaPagoYaRealizadoSiEstaAutorizada() {
        UUID idTransaccion = UUID.randomUUID();
        TransaccionPago transaccion = TransaccionPago.builder()
                .idTransaccion(idTransaccion)
                .idCliente(UUID.randomUUID())
                .estado(EstadoTransaccion.AUTORIZADA)
                .build();
        when(repository.findById(idTransaccion)).thenReturn(Optional.of(transaccion));

        String html = service.construirHtmlRedireccion(idTransaccion);

        assertThat(html).contains("Pago ya realizado");
        assertThat(html).doesNotContain("token_ws");
    }

    @Test
    void crearTransaccionConUnaReservaCobraSoloAbonoFijo() {
        UUID idCita = UUID.randomUUID();
        when(agendaClient.obtenerCita(idCita)).thenReturn(new CitaResumen(idCita, ID_CLIENTE, ID_SERVICIO, "PENDIENTE_PAGO"));

        CrearTransaccionResponse response = service.crearTransaccion(requestConReservas(List.of(reserva(idCita, BigDecimal.valueOf(28_990))), BigDecimal.valueOf(10_000)));

        ArgumentCaptor<TransaccionPago> captor = ArgumentCaptor.forClass(TransaccionPago.class);
        verify(repository, atLeast(1)).save(captor.capture());

        assertThat(response.urlWebpay()).startsWith("http://localhost:8080/api/pagos/webpay/simulado/");
        assertThat(captor.getValue().getMonto()).isEqualByComparingTo("10000");
        assertThat(captor.getValue().getDetalleItemsJson()).contains("\"precio\":28990");
        assertThat(captor.getValue().getDetalleItemsJson()).contains("\"abono\":10000");
        verify(catalogoClient, never()).obtenerServicio(any());
    }

    @Test
    void crearTransaccionConTresReservasCobraTresAbonos() {
        UUID primera = UUID.randomUUID();
        UUID segunda = UUID.randomUUID();
        UUID tercera = UUID.randomUUID();
        when(agendaClient.obtenerCita(primera)).thenReturn(new CitaResumen(primera, ID_CLIENTE, ID_SERVICIO, "PENDIENTE_PAGO"));
        when(agendaClient.obtenerCita(segunda)).thenReturn(new CitaResumen(segunda, ID_CLIENTE, ID_SERVICIO, "PENDIENTE_PAGO"));
        when(agendaClient.obtenerCita(tercera)).thenReturn(new CitaResumen(tercera, ID_CLIENTE, ID_SERVICIO, "PENDIENTE_PAGO"));

        service.crearTransaccion(requestConReservas(
                List.of(
                        reserva(primera, BigDecimal.valueOf(28_990)),
                        reserva(segunda, BigDecimal.valueOf(32_990)),
                        reserva(tercera, BigDecimal.valueOf(24_990))
                ),
                BigDecimal.valueOf(30_000)
        ));

        ArgumentCaptor<TransaccionPago> captor = ArgumentCaptor.forClass(TransaccionPago.class);
        verify(repository, atLeast(1)).save(captor.capture());

        assertThat(captor.getValue().getMonto()).isEqualByComparingTo("30000");
        verify(catalogoClient, never()).obtenerServicio(any());
    }

    @Test
    void crearTransaccionFallaControladoSiAgendaNoResponde() {
        UUID idCita = UUID.randomUUID();
        when(agendaClient.obtenerCita(idCita)).thenThrow(new ResourceAccessException("Read timed out"));

        assertThatThrownBy(() -> service.crearTransaccion(requestConReservas(
                List.of(reserva(idCita, BigDecimal.valueOf(28_990))),
                BigDecimal.valueOf(10_000)
        )))
                .isInstanceOf(PagosValidationException.class)
                .hasMessageContaining("Agenda temporalmente no disponible")
                .extracting("code")
                .isEqualTo("AGENDA_SERVICE_UNAVAILABLE");
    }

    private CrearTransaccionRequest requestConReservas(
            List<CrearTransaccionRequest.ReservaCarrito> reservas,
            BigDecimal total
    ) {
        return new CrearTransaccionRequest(
                null,
                ID_CLIENTE,
                "Carrito Style and Beauty",
                total,
                reservas,
                List.of()
        );
    }

    private CrearTransaccionRequest.ReservaCarrito reserva(UUID idCita, BigDecimal precioServicio) {
        return new CrearTransaccionRequest.ReservaCarrito(
                idCita,
                ID_SERVICIO,
                ID_STAFF,
                "Servicio demo",
                "Profesional demo",
                "2030-01-07",
                HORA_INICIO,
                HORA_INICIO.plusHours(1),
                precioServicio,
                BigDecimal.valueOf(10_000),
                60,
                15
        );
    }

    private static ObjectMapper objectMapper() {
        return new ObjectMapper().registerModule(new JavaTimeModule());
    }
}
