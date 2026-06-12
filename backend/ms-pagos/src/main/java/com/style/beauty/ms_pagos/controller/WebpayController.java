package com.style.beauty.ms_pagos.controller;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.style.beauty.ms_pagos.dto.CrearTransaccionRequest;
import com.style.beauty.ms_pagos.dto.CrearTransaccionResponse;
import com.style.beauty.ms_pagos.service.WebpayService;

import java.net.URI;
@RestController
@RequestMapping("/api/pagos/webpay")
@RequiredArgsConstructor
@Slf4j
public class WebpayController {
    private final WebpayService webpayService;

    @Value("${frontend.success-url:http://localhost/pago/exitoso}")
    private String frontendSuccessUrl;

    @Value("${frontend.error-url:http://localhost/pago/error}")
    private String frontendErrorUrl;

    @PostMapping("/crear")
    public CrearTransaccionResponse crearTransaccion(
            @Valid @RequestBody CrearTransaccionRequest request
    ) {
        return webpayService.crearTransaccion(request);
    }

    @GetMapping("/retorno")
    public ResponseEntity<Void> retornoGet(
            @RequestParam(value = "token_ws", required = false) String tokenWs,
            @RequestParam(value = "TBK_TOKEN", required = false) String tbkToken,
            @RequestParam(value = "TBK_ORDEN_COMPRA", required = false) String tbkOrdenCompra,
            @RequestParam(value = "TBK_ID_SESION", required = false) String tbkIdSesion
    ) {
        return procesarRetorno(tokenWs, tbkOrdenCompra);
    }

    @PostMapping("/retorno")
    public ResponseEntity<Void> retornoPost(
            @RequestParam(value = "token_ws", required = false) String tokenWs,
            @RequestParam(value = "TBK_TOKEN", required = false) String tbkToken,
            @RequestParam(value = "TBK_ORDEN_COMPRA", required = false) String tbkOrdenCompra,
            @RequestParam(value = "TBK_ID_SESION", required = false) String tbkIdSesion
    ) {
        return procesarRetorno(tokenWs, tbkOrdenCompra);
    }

    private ResponseEntity<Void> procesarRetorno(
            String tokenWs,
            String tbkOrdenCompra
    ) {
        try {
            if (tokenWs != null && !tokenWs.isBlank()) {
                webpayService.confirmarPago(tokenWs);

                return ResponseEntity
                        .status(302)
                        .location(URI.create(frontendSuccessUrl))
                        .build();
            }

            if (tbkOrdenCompra != null && !tbkOrdenCompra.isBlank()) {
                webpayService.marcarComoExpiradaPorAborto(tbkOrdenCompra);
            }

            return ResponseEntity
                    .status(302)
                    .location(URI.create(frontendErrorUrl))
                    .build();

        } catch (Exception e) {
            log.error("Error procesando retorno Webpay", e);
            return ResponseEntity
                    .status(302)
                    .location(URI.create(frontendErrorUrl))
                    .build();
        }
    }
}
