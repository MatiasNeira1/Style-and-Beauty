package com.style.beauty.ms_catalogo.dto;

public record SiteVisualAssetResponse(
        String assetKey,
        String title,
        String description,
        String imageUrl,
        String altText,
        String section,
        String objectPosition,
        boolean active
) {
}
