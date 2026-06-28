package com.style.beauty.ms_cliente.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StaffPortfolioImageDTO(
        UUID idFoto,
        String urlFoto,
        String nombreArchivo,
        OffsetDateTime createdAt
) {
}
