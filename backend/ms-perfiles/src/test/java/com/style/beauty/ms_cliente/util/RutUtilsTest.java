package com.style.beauty.ms_cliente.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RutUtilsTest {

    @Test
    void validaRutConYsinPuntos() {
        assertThat(RutUtils.isValidRut("12.345.678-5")).isTrue();
        assertThat(RutUtils.isValidRut("12345678-5")).isTrue();
        assertThat(RutUtils.isValidRut("21.843.425-8")).isTrue();
        assertThat(RutUtils.isValidRut("21843425-8")).isTrue();
    }

    @Test
    void validaRutConDvK() {
        assertThat(RutUtils.isValidRut("1.000.005-K")).isTrue();
        assertThat(RutUtils.normalizeRut("1.000.005-k")).isEqualTo("1000005-K");
    }

    @Test
    void rechazaRutInvalido() {
        assertThat(RutUtils.isValidRut("")).isFalse();
        assertThat(RutUtils.isValidRut("12345678-9")).isFalse();
        assertThat(RutUtils.isValidRut("abc")).isFalse();
        assertThat(RutUtils.isValidRut("12.345.678")).isFalse();
        assertThat(RutUtils.isValidRut("12.345.678-X")).isFalse();
    }
}
