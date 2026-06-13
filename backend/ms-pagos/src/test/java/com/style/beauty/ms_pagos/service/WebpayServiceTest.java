package com.style.beauty.ms_pagos.service;

import com.style.beauty.ms_pagos.client.AgendaClient;
import com.style.beauty.ms_pagos.client.CatalogoClient;
import com.style.beauty.ms_pagos.entity.TransaccionPago;
import com.style.beauty.ms_pagos.enums.EstadoTransaccion;
import com.style.beauty.ms_pagos.repository.TransaccionPagoRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WebpayServiceTest {

    private final TransaccionPagoRepository repository = mock(TransaccionPagoRepository.class);
    private final AgendaClient agendaClient = mock(AgendaClient.class);
    private final CatalogoClient catalogoClient = mock(CatalogoClient.class);
    private final WebpayService service = new WebpayService(repository, agendaClient, catalogoClient);

    @Test
    void redireccionWebpayDevuelveHtmlConFormularioPostYTokenWs() {
        UUID idTransaccion = UUID.randomUUID();
        TransaccionPago transaccion = TransaccionPago.builder()
                .idTransaccion(idTransaccion)
                .idCita(UUID.randomUUID())
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
                .idCita(UUID.randomUUID())
                .idCliente(UUID.randomUUID())
                .estado(EstadoTransaccion.AUTORIZADA)
                .build();
        when(repository.findById(idTransaccion)).thenReturn(Optional.of(transaccion));

        String html = service.construirHtmlRedireccion(idTransaccion);

        assertThat(html).contains("Pago ya realizado");
        assertThat(html).doesNotContain("token_ws");
    }
}
