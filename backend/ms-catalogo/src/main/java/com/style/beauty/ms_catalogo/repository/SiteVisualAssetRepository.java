package com.style.beauty.ms_catalogo.repository;

import com.style.beauty.ms_catalogo.entity.SiteVisualAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SiteVisualAssetRepository extends JpaRepository<SiteVisualAsset, UUID> {
    Optional<SiteVisualAsset> findByAssetKey(String assetKey);
}
