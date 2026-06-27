import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useSiteVisualAssets } from '../../hooks/useSiteVisualAssets.js';
import { assetFallback, heroImageStyle } from '../../utils/siteVisualAssets.js';

export function AboutPage() {
  const visualAssetsQuery = useSiteVisualAssets();

  return (
    <>
      <section
        className="page-hero page-hero-about"
        style={heroImageStyle(visualAssetsQuery.getAsset('about.hero'), assetFallback('about.hero'), 'center 42%')}
      >
        <div className="page-hero-media" />
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
