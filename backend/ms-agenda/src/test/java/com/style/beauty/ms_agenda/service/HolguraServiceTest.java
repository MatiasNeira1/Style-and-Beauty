package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.ServicioResumen;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class HolguraServiceTest {

    private final HolguraService holguraService = new HolguraService();

    @Test
    void usaHolguraConfiguradaEnCatalogo() {
        assertThat(holgura("Manicure permanente", "Manicure", 15)).isEqualTo(15);
        assertThat(holgura("Mechas balayage", "Cabello", 30)).isEqualTo(30);
        assertThat(holgura("Limpieza facial profunda", "Cuidados de la piel", 20)).isEqualTo(20);
    }

    @Test
    void usaHolguraPorCategoriaSiCatalogoNoLaEnvia() {
        assertThat(holgura("Corte express", "Cabello", 20, null)).isEqualTo(15);
        assertThat(holgura("Maquillaje express", "Maquillaje", 60, null)).isEqualTo(15);
        assertThat(holgura("Manicure express", "Nails", 15, null)).isEqualTo(10);
        assertThat(holgura("Limpieza facial express", "Piel", 20, null)).isEqualTo(15);
        assertThat(holgura("Masaje express", "Spa", 30, null)).isEqualTo(25);
    }

    @Test
    void ajustaHolguraConfiguradaSiEsIgualOMayorALaDuracion() {
        assertThat(holgura("Corte express", "Cabello", 20, 30)).isEqualTo(15);
        assertThat(holgura("Servicio minimo", "Spa", 5, 30)).isEqualTo(0);
    }

    @Test
    void usaFallbackSeguroSiNoHayHolguraConfiguradaNiCategoriaConocida() {
        ServicioResumen servicio = new ServicioResumen(UUID.randomUUID(), "Servicio", "Categoria", 60, null);

        assertThat(holguraService.calcularHolguraMin(servicio)).isEqualTo(15);
    }

    @Test
    void usaHolguraDeStaffSiServicioNoTieneHolgura() {
        ServicioResumen servicio = new ServicioResumen(UUID.randomUUID(), "Servicio", "Categoria", 60, null);

        assertThat(holguraService.calcularHolguraMin(servicio, 20)).isEqualTo(20);
    }

    private int holgura(String nombre, String categoria, Integer holguraMinutos) {
        return holgura(nombre, categoria, 60, holguraMinutos);
    }

    private int holgura(String nombre, String categoria, Integer duracionMinutos, Integer holguraMinutos) {
        return holguraService.calcularHolguraMin(
                new ServicioResumen(UUID.randomUUID(), nombre, categoria, duracionMinutos, holguraMinutos)
        );
    }
}
