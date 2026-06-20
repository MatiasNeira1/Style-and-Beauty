package com.style.beauty.ms_pagos.exception;

public class PagosValidationException extends RuntimeException {
    private final String field;
    private final String code;

    public PagosValidationException(String message, String field, String code) {
        super(message);
        this.field = field;
        this.code = code;
    }

    public String getField() {
        return field;
    }

    public String getCode() {
        return code;
    }
}
