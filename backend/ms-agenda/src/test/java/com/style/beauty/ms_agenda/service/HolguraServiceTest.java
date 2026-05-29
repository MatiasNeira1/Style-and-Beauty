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
        assertThat(holgura("Mechas balayage", "Peluqueria")).isEqualTo(30);
        assertThat(holgura("Botox capilar", "Peluqueria")).isEqualTo(30);
        assertThat(holgura("Alisado organico", "Peluqueria")).isEqualTo(30);
        assertThat(holgura("Tintura global", "Peluqueria")).isEqualTo(30);
        assertThat(holgura("Corte de pelo", "Peluqueria")).isEqualTo(10);
        assertThat(holgura("Peinado fiesta", "Peluqueria")).isEqualTo(10);
        assertThat(holgura("Hidratacion capilar", "Peluqueria")).isEqualTo(10);
        assertThat(holgura("Limpieza facial profunda", "Cuidados de la piel")).isEqualTo(10);
        assertThat(holgura("Masaje descontracturante", "Masajes")).isEqualTo(20);
        assertThat(holgura("Maquillaje social", "Maquillaje")).isEqualTo(15);
        assertThat(holgura("Maquillaje de novia", "Maquillaje")).isEqualTo(30);
    }

    private int holgura(String nombre, String categoria) {
        return holguraService.calcularHolguraMin(new ServicioResumen(UUID.randomUUID(), nombre, categoria, 60));
    }
}
