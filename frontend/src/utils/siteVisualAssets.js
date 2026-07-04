import { HOME_HERO_IMAGE_URL, resolveAssetUrl } from '../services/apiClient.js';

export const SITE_VISUAL_ASSET_STALE_TIME_MS = 1000 * 60 * 10;
export const SITE_VISUAL_ASSET_GC_TIME_MS = 1000 * 60 * 30;

export const SITE_VISUAL_ASSET_DEFINITIONS = [
  {
    assetKey: 'home.hero',
    title: 'Home / Dashboard publico',
    description: 'Imagen principal de la pantalla de inicio.',
    section: 'Home',
    fallback: HOME_HERO_IMAGE_URL,
    objectPosition: 'center 28%',
  },
  {
    assetKey: 'services.hero',
    title: 'Hero principal de Servicios',
    description: 'Cabecera del catalogo publico de servicios.',
    section: 'Servicios',
    fallback: '/hero-salon.png',
    objectPosition: 'center 42%',
  },
  {
    assetKey: 'services.category.nails',
    title: 'Hero de categoria Nails',
    description: 'Imagen para la categoria Nails.',
    section: 'Categorias de servicios',
    fallback: '/hero-salon.png',
    objectPosition: 'center',
  },
  {
    assetKey: 'services.category.cabello',
    title: 'Hero de categoria Cabello',
    description: 'Imagen para la categoria Cabello.',
    section: 'Categorias de servicios',
    fallback: '/hero-salon.png',
    objectPosition: 'center 36%',
  },
  {
    assetKey: 'services.category.piel',
    title: 'Hero de categoria Cuidados de la piel',
    description: 'Imagen para la categoria Cuidados de la piel.',
    section: 'Categorias de servicios',
    fallback: '/hero-salon.png',
    objectPosition: 'center',
  },
  {
    assetKey: 'services.category.spa',
    title: 'Hero de categoria Spa',
    description: 'Imagen para la categoria Spa.',
    section: 'Categorias de servicios',
    fallback: '/hero-salon.png',
    objectPosition: 'center',
  },
  {
    assetKey: 'services.category.maquillaje',
    title: 'Hero de categoria Maquillaje',
    description: 'Imagen para la categoria Maquillaje.',
    section: 'Categorias de servicios',
    fallback: '/hero-salon.png',
    objectPosition: 'center',
  },
  {
    assetKey: 'professionals.hero',
    title: 'Hero de Profesionales',
    description: 'Cabecera del directorio publico de profesionales.',
    section: 'Profesionales',
    fallback: '/jefes.png',
    objectPosition: 'center 28%',
  },
  {
    assetKey: 'products.hero',
    title: 'Hero de Productos',
    description: 'Cabecera de la vitrina publica de productos.',
    section: 'Productos',
    fallback: '/hero-salon.png',
    objectPosition: 'center 42%',
  },
  {
    assetKey: 'booking.hero',
    title: 'Hero de Reservar',
    description: 'Cabecera del flujo de reserva publica.',
    section: 'Reservar',
    fallback: HOME_HERO_IMAGE_URL,
    objectPosition: 'center 42%',
  },
  {
    assetKey: 'contact.hero',
    title: 'Hero de Contacto',
    description: 'Cabecera de la pagina de contacto.',
    section: 'Contacto',
    fallback: '/hero-salon.png',
    objectPosition: 'center',
  },
  {
    assetKey: 'about.hero',
    title: 'Hero de Nosotros',
    description: 'Cabecera de la pagina institucional.',
    section: 'Nosotros',
    fallback: '/hero-salon.png',
    objectPosition: 'center 42%',
  },
];

const CATEGORY_ASSET_KEYS = {
  nails: 'services.category.nails',
  unas: 'services.category.nails',
  manicure: 'services.category.nails',
  cabello: 'services.category.cabello',
  hair: 'services.category.cabello',
  piel: 'services.category.piel',
  facial: 'services.category.piel',
  'cuidados-de-la-piel': 'services.category.piel',
  spa: 'services.category.spa',
  maquillaje: 'services.category.maquillaje',
  make: 'services.category.maquillaje',
  makeup: 'services.category.maquillaje',
};

export function normalizeAssetText(value = '') {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function assetSlug(value = '') {
  return normalizeAssetText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function serviceCategoryAssetKey(category) {
  const slug = assetSlug(category);
  if (CATEGORY_ASSET_KEYS[slug]) return CATEGORY_ASSET_KEYS[slug];
  const text = normalizeAssetText(category);
  if (text.includes('piel') || text.includes('facial')) return CATEGORY_ASSET_KEYS.piel;
  if (text.includes('cabello') || text.includes('pelo')) return CATEGORY_ASSET_KEYS.cabello;
  if (text.includes('maquillaje')) return CATEGORY_ASSET_KEYS.maquillaje;
  if (text.includes('nail') || text.includes('una')) return CATEGORY_ASSET_KEYS.nails;
  if (text.includes('spa')) return CATEGORY_ASSET_KEYS.spa;
  return null;
}

export function assetFallback(assetKey) {
  return SITE_VISUAL_ASSET_DEFINITIONS.find((item) => item.assetKey === assetKey)?.fallback || '/hero-salon.png';
}

export function assetDefaultPosition(assetKey) {
  return SITE_VISUAL_ASSET_DEFINITIONS.find((item) => item.assetKey === assetKey)?.objectPosition || 'center';
}

export function hasActiveAssetImage(asset) {
  return Boolean(asset?.active !== false && asset?.imageUrl);
}

export function visualAssetsInitialLoading(query) {
  const hasRows = Array.isArray(query?.assets) && query.assets.length > 0;
  return Boolean((query?.isLoading || query?.isPending) && !hasRows);
}

export function resolveVisualAssetImage({
  asset,
  imageUrl = '',
  fallback = '/hero-salon.png',
  isLoading = false,
} = {}) {
  if (hasActiveAssetImage(asset)) {
    return { src: asset.imageUrl, source: 'admin', isPending: false };
  }

  if (isLoading) {
    return { src: '', source: 'pending', isPending: true };
  }

  if (imageUrl) {
    return { src: imageUrl, source: 'content', isPending: false };
  }

  return { src: fallback, source: 'fallback', isPending: false };
}

export function assetImage(asset, fallback = '/hero-salon.png', options = {}) {
  return resolveVisualAssetImage({
    asset,
    fallback,
    isLoading: options.isLoading,
  }).src;
}

export function assetPosition(asset, fallback = 'center') {
  return asset?.objectPosition || fallback;
}

export function cssImageUrl(value) {
  return `url("${String(value || '').replace(/"/g, '%22')}")`;
}

export function heroImageStyle(asset, fallback, positionFallback = 'center', options = {}) {
  const resolved = resolveVisualAssetImage({
    asset,
    fallback,
    isLoading: options.isLoading,
  });

  return {
    ...(resolved.src ? { '--page-hero-image': cssImageUrl(resolved.src) } : {}),
    '--page-hero-position': assetPosition(asset, positionFallback),
  };
}

const preloadedImageUrls = new Set();

export function preloadImageUrl(value) {
  const href = resolveAssetUrl(value);
  if (!href || typeof document === 'undefined') return href || '';
  if (preloadedImageUrls.has(href)) return href;

  const alreadyExists = Array.from(document.head.querySelectorAll('link[rel="preload"][as="image"]'))
    .some((link) => link.href === href || link.getAttribute('href') === href);
  if (alreadyExists) {
    preloadedImageUrls.add(href);
    return href;
  }

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = href;
  link.fetchPriority = 'high';
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
  preloadedImageUrls.add(href);
  return href;
}

export function preloadImageUrls(values = []) {
  values.filter(Boolean).forEach((value) => preloadImageUrl(value));
}
