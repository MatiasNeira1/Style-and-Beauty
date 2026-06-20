package com.style.beauty.ms_agenda.dto;

import jakarta.validation.constraints.NotBlank;

public record CalendarConfigRequest(
        @NotBlank String calendarId,
        Boolean activo
) {
}
