package com.style.beauty.ms_cliente.util;

public final class PhoneUtils {
    private static final String CHILE_PHONE_PATTERN = "^56[2-9]\\d{8}$";
    private static final String ALLOWED_PHONE_CHARS = "^[0-9+\\s().-]+$";

    private PhoneUtils() {
    }

    public static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public static String digitsOnly(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    public static boolean isValidChilePhone(String value) {
        if (isBlank(value) || !value.trim().matches(ALLOWED_PHONE_CHARS)) {
            return false;
        }
        return digitsOnly(value).matches(CHILE_PHONE_PATTERN);
    }

    public static String normalizeChilePhone(String value) {
        if (isBlank(value)) {
            return "";
        }
        if (!isValidChilePhone(value)) {
            throw new IllegalArgumentException("Ingresa un telefono chileno valido, por ejemplo +56 9 1234 5678.");
        }
        return digitsOnly(value);
    }
}
