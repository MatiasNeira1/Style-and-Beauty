package com.style.beauty.ms_pagos.dto;

public record ApiError(
        String message,
        String field,
        String code
) {
}
