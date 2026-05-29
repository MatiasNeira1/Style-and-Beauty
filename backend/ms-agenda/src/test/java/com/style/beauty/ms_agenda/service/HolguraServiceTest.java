package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.ServicioResumen;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class HolguraServiceTest {

    private final HolguraService holguraService = new HolguraService();

    @Test
    void aplicaHolguraPorTipoDeServicio() {
        assertThat(holgura("Manicure permanente", "Manicure")).isEqualTo(15);
        assertThat(holgura("Uñas acrilicas", "Nails")).isEqualTo(15);
        assertThat(holgura("Mechas balayage", "Cabello")).isEqualTo(30);
        assertThat(holgura("Botox capilar", "Cabello")).isEqualTo(30);
        assertThat(holgura("Alisado organico", "Peluqueria")).isEqualTo(30);
        assertThat(holgura("Tintura global", "Cabello")).isEqualTo(30);
        assertThat(holgura("Corte de pelo", "Cabello")).isEqualTo(30);
        assertThat(holgura("Limpieza facial profunda", "Cuidados de la piel")).isEqualTo(20);
        assertThat(holgura("Masaje descontracturante", "Spa")).isEqualTo(30);
        assertThat(holgura("Ritual relajacion", "Spa")).isEqualTo(30);
        assertThat(holgura("Maquillaje social", "Maquillaje")).isEqualTo(15);
        assertThat(holgura("Maquillaje de novia", "Maquillaje")).isEqualTo(15);
        assertThat(holgura("Servicio personalizado", "Otra categoria")).isEqualTo(15);
    }

    private int holgura(String nombre, String categoria) {
        return holguraService.calcularHolguraMin(new ServicioResumen(UUID.randomUUID(), nombre, categoria, 60));
    }
}
