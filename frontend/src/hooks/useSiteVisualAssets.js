import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { siteVisualAssetService } from '../services/siteVisualAssetService.js';

export function useSiteVisualAssets(options = {}) {
  const query = useQuery({
    queryKey: ['site-visual-assets'],
    queryFn: siteVisualAssetService.listAssets,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: false,
    ...options,
  });

  const assetsByKey = useMemo(() => {
    const rows = Array.isArray(query.data) ? query.data : [];
    return rows.reduce((acc, asset) => {
      if (asset?.assetKey) acc[asset.assetKey] = asset;
      return acc;
    }, {});
  }, [query.data]);

  return {
    ...query,
    assets: Array.isArray(query.data) ? query.data : [],
    assetsByKey,
    getAsset: (assetKey) => assetsByKey[assetKey] || null,
  };
}
