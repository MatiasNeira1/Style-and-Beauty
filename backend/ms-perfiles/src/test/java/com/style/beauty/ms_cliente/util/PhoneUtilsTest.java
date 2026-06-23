package com.style.beauty.ms_cliente.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PhoneUtilsTest {

    @Test
    void validaTelefonoChilenoConFormatoYNormalizado() {
        assertThat(PhoneUtils.isValidChilePhone("+56 9 1234 5678")).isTrue();
        assertThat(PhoneUtils.isValidChilePhone("56912345678")).isTrue();
        assertThat(PhoneUtils.normalizeChilePhone("+56 9 1234 5678")).isEqualTo("56912345678");
    }

    @Test
    void rechazaTelefonoNoChilenoOConTexto() {
        assertThat(PhoneUtils.isValidChilePhone("912345678")).isFalse();
        assertThat(PhoneUtils.isValidChilePhone("+54 9 1234 5678")).isFalse();
        assertThat(PhoneUtils.isValidChilePhone("abc56912345678")).isFalse();

        assertThatThrownBy(() -> PhoneUtils.normalizeChilePhone("abc56912345678"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("telefono chileno");
    }
}
