package com.style.beauty.ms_pagos.enums;

public enum EstadoTransaccion {
    CREADA("Transacción creada en el sistema", false),
    PENDIENTE("Transacción enviada a Webpay, esperando pago", false),
    AUTORIZADA("Pago aprobado por Webpay", true),
    RECHAZADA("Pago rechazado por Webpay", true),
    ERROR("Error al procesar la transacción", true),
    EXPIRADA("Transacción expirada por tiempo de espera", true);

    private final String descripcion;
    private final boolean estadoFinal;

    EstadoTransaccion(String descripcion, boolean estadoFinal) {
        this.descripcion = descripcion;
        this.estadoFinal = estadoFinal;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public boolean isEstadoFinal() {
        return estadoFinal;
    }
}
