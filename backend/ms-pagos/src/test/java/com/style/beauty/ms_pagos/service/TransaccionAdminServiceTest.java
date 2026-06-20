package com.style.beauty.ms_pagos.service;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TransaccionAdminServiceTest {
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final TransaccionAdminService service = new TransaccionAdminService(jdbcTemplate);

    @Test
    void listarTransaccionesRetornaVacioSiNoExistenColumnas() {
        when(jdbcTemplate.queryForList(org.mockito.ArgumentMatchers.anyString(), eq(String.class))).thenReturn(List.of());

        assertThat(service.listarTransacciones()).isEmpty();
    }

    @Test
    void listarTransaccionesRetornaVacioSiFallaConsultaDeColumnas() {
        when(jdbcTemplate.queryForList(org.mockito.ArgumentMatchers.anyString(), eq(String.class)))
                .thenThrow(new DataAccessResourceFailureException("sin conexion"));

        assertThat(service.listarTransacciones()).isEmpty();
    }
}
