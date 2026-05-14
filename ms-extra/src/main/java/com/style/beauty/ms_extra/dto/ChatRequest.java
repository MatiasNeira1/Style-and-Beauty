package com.style.beauty.ms_extra.dto;

import com.style.beauty.ms_extra.enums.RemitenteChat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChatRequest(
        @NotNull UUID idUsuario,
        @NotNull RemitenteChat remitente,
        @NotBlank String mensaje) {
}