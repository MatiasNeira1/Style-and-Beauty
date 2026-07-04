import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { siteVisualAssetService } from '../services/siteVisualAssetService.js';
import { SITE_VISUAL_ASSET_GC_TIME_MS, SITE_VISUAL_ASSET_STALE_TIME_MS } from '../utils/siteVisualAssets.js';

export function useSiteVisualAssets(options = {}) {
  const query = useQuery({
    queryKey: ['site-visual-assets'],
    queryFn: ({ signal }) => siteVisualAssetService.listAssets({ signal }),
    staleTime: SITE_VISUAL_ASSET_STALE_TIME_MS,
    gcTime: SITE_VISUAL_ASSET_GC_TIME_MS,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
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

  const getAsset = useCallback((assetKey) => assetsByKey[assetKey] || null, [assetsByKey]);

  return {
    ...query,
    assets: Array.isArray(query.data) ? query.data : [],
    assetsByKey,
    getAsset,
  };
}
