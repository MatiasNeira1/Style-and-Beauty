package com.style.beauty.ms_agenda.dto;

import java.time.OffsetDateTime;

public record DisponibilidadSlot(
        OffsetDateTime inicio,
        OffsetDateTime fin,
        OffsetDateTime finConHolgura) {
}
