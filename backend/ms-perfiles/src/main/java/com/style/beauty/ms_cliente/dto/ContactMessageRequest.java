package com.style.beauty.ms_cliente.dto;

public record ContactMessageRequest(
        String name,
        String email,
        String phone,
        String subject,
        String message) {
}
