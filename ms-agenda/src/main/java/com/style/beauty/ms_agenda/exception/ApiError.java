package com.style.beauty.ms_agenda.exception;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
public class ApiError {

    private OffsetDateTime timestamp;

    private Integer status;

    private String error;

    private String message;

    private String path;

    private List<String> details;
}