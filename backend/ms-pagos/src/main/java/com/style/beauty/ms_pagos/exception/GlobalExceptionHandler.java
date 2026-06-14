package com.style.beauty.ms_pagos.exception;

import com.style.beauty.ms_pagos.dto.ApiError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(PagosValidationException.class)
    public ResponseEntity<ApiError> handlePagosValidation(PagosValidationException ex) {
        return ResponseEntity.badRequest().body(new ApiError(ex.getMessage(), ex.getField(), ex.getCode()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        var fieldError = ex.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
        String field = fieldError == null ? null : fieldError.getField();
        String message = fieldError == null ? "Payload invalido." : fieldError.getDefaultMessage();
        return ResponseEntity.badRequest().body(new ApiError(message, field, "VALIDATION_ERROR"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(new ApiError("El cuerpo de la solicitud no tiene un formato valido.", "body", "INVALID_JSON"));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        String code = status == null ? "REQUEST_ERROR" : status.name();
        String message = ex.getReason() == null || ex.getReason().isBlank()
                ? "Solicitud invalida."
                : ex.getReason();
        return ResponseEntity.status(ex.getStatusCode()).body(new ApiError(message, null, code));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex) {
        log.error("Error no controlado en ms-pagos", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ApiError(
                        "No se pudo procesar el pago. Intenta nuevamente o contacta soporte.",
                        null,
                        "PAYMENT_PROCESSING_ERROR"
                )
        );
    }
}
