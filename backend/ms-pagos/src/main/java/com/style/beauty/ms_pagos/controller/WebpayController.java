package com.style.beauty.ms_pagos.controller;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.style.beauty.ms_pagos.dto.CrearTransaccionRequest;
import com.style.beauty.ms_pagos.dto.CrearTransaccionResponse;
import com.style.beauty.ms_pagos.exception.PagosValidationException;
import com.style.beauty.ms_pagos.service.WebpayService;

import java.net.URI;
@RestController
@RequestMapping("/api/pagos/webpay")
@RequiredArgsConstructor
@Slf4j
public class WebpayController {
    private final WebpayService webpayService;

    @Value("${frontend.success-url}")
    private String frontendSuccessUrl;

    @Value("${frontend.error-url}")
    private String frontendErrorUrl;

    @PostMapping("/crear")
    public CrearTransaccionResponse crearTransaccion(
            @Valid @RequestBody CrearTransaccionRequest request
    ) {
        try {
            return webpayService.crearTransaccion(request);
        } catch (PagosValidationException e) {
            throw e;
        } catch (IllegalStateException e) {
            throw new PagosValidationException(e.getMessage(), "request", "PAYMENT_PAYLOAD_INVALID");
        }
    }

    @GetMapping(value = "/redirigir/{idTransaccion}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> redirigir(@PathVariable java.util.UUID idTransaccion) {
        try {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(webpayService.construirHtmlRedireccion(idTransaccion));
        } catch (IllegalStateException e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("no encontrada")) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
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
                        .location(frontendLocation(frontendSuccessUrl))
                        .build();
            }

            if (tbkOrdenCompra != null && !tbkOrdenCompra.isBlank()) {
                webpayService.marcarComoExpiradaPorAborto(tbkOrdenCompra);
            }

            return ResponseEntity
                    .status(302)
                    .location(frontendLocation(frontendErrorUrl))
                    .build();

        } catch (Exception e) {
            log.error("Error procesando retorno Webpay", e);
            return ResponseEntity
                    .status(302)
                    .location(frontendLocation(frontendErrorUrl))
                    .build();
        }
    }

    private URI frontendLocation(String configuredUrl) {
        String fallback = "https://styleandbeauty.me/pago/retorno";
        if (configuredUrl == null || configuredUrl.isBlank()) {
            return URI.create(fallback);
        }
        String normalized = configuredUrl.trim();
        if (normalized.toLowerCase().contains(".internal.")) {
            return URI.create(fallback);
        }
        return URI.create(normalized);
    }
}
