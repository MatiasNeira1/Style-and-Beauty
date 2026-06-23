package com.style.beauty.ms_cliente.util;

public final class RutUtils {
    private static final String ALLOWED_RUT_CHARS = "^[0-9kK.\\-\\s]+$";

    private RutUtils() {
    }

    public static String cleanRut(String rut) {
        if (rut == null) {
            return "";
        }
        return rut.replace(".", "")
                .replace("-", "")
                .replaceAll("\\s+", "")
                .toUpperCase();
    }

    public static String normalizeRut(String rut) {
        String clean = cleanRut(rut);
        if (clean.length() < 2) {
            return "";
        }
        return clean.substring(0, clean.length() - 1) + "-" + clean.substring(clean.length() - 1);
    }

    public static boolean isValidRut(String rut) {
        if (rut == null || rut.isBlank() || !rut.trim().matches(ALLOWED_RUT_CHARS)) {
            return false;
        }

        String clean = cleanRut(rut);
        if (!clean.matches("^\\d{7,8}[0-9K]$")) {
            return false;
        }

        String body = clean.substring(0, clean.length() - 1);
        String dv = clean.substring(clean.length() - 1);
        return calculateDv(body).equals(dv);
    }

    public static String compactRut(String rut) {
        return cleanRut(rut);
    }

    private static String calculateDv(String body) {
        int sum = 0;
        int multiplier = 2;

        for (int index = body.length() - 1; index >= 0; index--) {
            sum += Character.digit(body.charAt(index), 10) * multiplier;
            multiplier = multiplier == 7 ? 2 : multiplier + 1;
        }

        int expected = 11 - (sum % 11);
        if (expected == 11) {
            return "0";
        }
        if (expected == 10) {
            return "K";
        }
        return String.valueOf(expected);
    }
}
