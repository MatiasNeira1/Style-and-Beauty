import { useEffect, useMemo } from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { useSiteVisualAssets } from '../../hooks/useSiteVisualAssets.js';
import {
  assetFallback,
  assetPosition,
  preloadImageUrls,
  resolveVisualAssetImage,
  visualAssetsInitialLoading,
} from '../../utils/siteVisualAssets.js';

export function AboutPage() {
  const visualAssetsQuery = useSiteVisualAssets();
  const aboutHeroAsset = visualAssetsQuery.getAsset('about.hero');
  const visualAssetsLoading = visualAssetsInitialLoading(visualAssetsQuery);
  const aboutHeroImage = useMemo(() => resolveVisualAssetImage({
    asset: aboutHeroAsset,
    fallback: assetFallback('about.hero'),
    isLoading: visualAssetsLoading,
  }), [aboutHeroAsset, visualAssetsLoading]);

  useEffect(() => {
    preloadImageUrls([aboutHeroImage.src]);
  }, [aboutHeroImage.src]);

  return (
    <>
      <section
        className="page-hero page-hero-about"
        style={{ '--page-hero-position': assetPosition(aboutHeroAsset, 'center 42%') }}
      >
        {aboutHeroImage.isPending ? (
          <div className="page-hero-media page-hero-skeleton" aria-hidden="true" />
        ) : (
          <SafeImage
            src={aboutHeroImage.src}
            fallback={assetFallback('about.hero')}
            alt=""
            aria-hidden="true"
            className="page-hero-media page-hero-image"
            loading="eager"
            fetchPriority="high"
            width={1024}
            height={1024}
          />
        )}
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="card-kicker">Nosotros</span>
          <h1>Equipo especialista en belleza y bienestar</h1>
          <p>Un salon enfocado en cuidado profesional, atencion cercana y resultados pensados para cada persona.</p>
        </div>
      </section>

      <section className="page-section about-page client-view">
        <SectionTitle eyebrow="Style & Beauty" title="Cuidado profesional">
          Equipo especialista en belleza, cuidado y bienestar.
        </SectionTitle>
      </section>
    </>
  );
}
