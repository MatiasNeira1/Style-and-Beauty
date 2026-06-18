import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_IMAGE_FALLBACK, resolveAssetUrl } from '../../services/apiClient.js';

function normalizedImageSource(value) {
  const text = String(value || '').trim();
  if (!text || ['null', 'undefined', 'nan'].includes(text.toLowerCase())) {
    return '';
  }
  return text;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallback = DEFAULT_IMAGE_FALLBACK,
  loading = 'lazy',
  decoding = 'async',
  ...props
}) {
  const fallbackSrc = useMemo(() => resolveAssetUrl(fallback, DEFAULT_IMAGE_FALLBACK), [fallback]);
  const resolvedSrc = useMemo(() => resolveAssetUrl(normalizedImageSource(src), fallbackSrc), [src, fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);

  useEffect(() => {
    setCurrentSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      className={className}
      data-fallback={currentSrc === fallbackSrc ? 'true' : undefined}
      loading={loading}
      decoding={decoding}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
