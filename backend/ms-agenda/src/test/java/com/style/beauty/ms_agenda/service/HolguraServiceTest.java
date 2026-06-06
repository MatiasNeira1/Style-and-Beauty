package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HolguraServiceTest {

    private final HolguraService holguraService = new HolguraService();

    @Test
    void usaHolguraConfiguradaEnCatalogo() {
        assertThat(holgura("Manicure permanente", "Manicure", 15)).isEqualTo(15);
        assertThat(holgura("Mechas balayage", "Cabello", 30)).isEqualTo(30);
        assertThat(holgura("Limpieza facial profunda", "Cuidados de la piel", 20)).isEqualTo(20);
    }

    @Test
    void rechazaServicioSinHolguraConfigurada() {
        ServicioResumen servicio = new ServicioResumen(UUID.randomUUID(), "Servicio", "Categoria", 60, null);

        assertThatThrownBy(() -> holguraService.calcularHolguraMin(servicio))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("holgura");
    }

    private int holgura(String nombre, String categoria, Integer holguraMinutos) {
        return holguraService.calcularHolguraMin(
                new ServicioResumen(UUID.randomUUID(), nombre, categoria, 60, holguraMinutos)
        );
    }
}
