package com.style.beauty.ms_cliente.util;

import java.net.URI;
import java.util.Locale;

public final class ProfileImageUrlValidator {
    private static final int MAX_IMAGE_URL_LENGTH = 512;
    private static final String INVALID_IMAGE_MESSAGE = "La imagen no pudo guardarse. Sube una imagen válida.";

    private ProfileImageUrlValidator() {
    }

    public static String validateStoredUrl(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }

        String url = value.trim();
        String lower = url.toLowerCase(Locale.ROOT);

        if (url.length() > MAX_IMAGE_URL_LENGTH
                || lower.startsWith("data:")
                || lower.contains(";base64")
                || hasSasToken(lower)) {
            throw new IllegalArgumentException(INVALID_IMAGE_MESSAGE);
        }

        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) {
                throw new IllegalArgumentException(INVALID_IMAGE_MESSAGE);
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(INVALID_IMAGE_MESSAGE, e);
        }

        return url;
    }

    private static boolean hasSasToken(String lowerUrl) {
        return lowerUrl.contains("?sig=")
                || lowerUrl.contains("&sig=")
                || lowerUrl.contains("?sv=")
                || lowerUrl.contains("&sv=")
                || lowerUrl.contains("?se=")
                || lowerUrl.contains("&se=")
                || lowerUrl.contains("?sp=")
                || lowerUrl.contains("&sp=");
    }
}
