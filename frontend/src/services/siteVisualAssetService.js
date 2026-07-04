import { CATALOG_API_BASE_URL, request } from './apiClient.js';

function imageFormData(file, fields = {}) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  if (file) {
    formData.append('file', file);
  }
  return formData;
}

export const siteVisualAssetService = {
  listAssets: ({ signal } = {}) => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/catalogo/site-visual-assets', signal }),
  saveAssetImage: (assetKey, file, fields = {}) => request({
    baseURL: CATALOG_API_BASE_URL,
    url: `/api/catalogo/site-visual-assets/${encodeURIComponent(assetKey)}/image`,
    method: 'POST',
    authRequired: true,
    data: imageFormData(file, fields),
  }),
};
