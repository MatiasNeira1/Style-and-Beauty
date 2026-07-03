import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Image, MonitorSmartphone, RefreshCw, Save, Sparkles, X } from 'lucide-react';
import { AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { siteVisualAssetService } from '../../services/siteVisualAssetService.js';
import {
  SITE_VISUAL_ASSET_DEFINITIONS,
  assetFallback,
  assetImage,
  assetPosition,
} from '../../utils/siteVisualAssets.js';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function assetRows(serverAssets = []) {
  const assetsByKey = serverAssets.reduce((acc, asset) => {
    if (asset?.assetKey) acc[asset.assetKey] = asset;
    return acc;
  }, {});

  return SITE_VISUAL_ASSET_DEFINITIONS.map((definition) => {
    const asset = assetsByKey[definition.assetKey] || {};
    return {
      ...definition,
      ...asset,
      fallback: definition.fallback,
      objectPosition: asset.objectPosition || definition.objectPosition,
      configured: Boolean(asset.imageUrl),
    };
  });
}

function validateImageFile(file) {
  if (!file) return '';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Solo se permiten imagenes JPG, PNG o WEBP.';
  if (file.size > MAX_IMAGE_SIZE_BYTES) return 'La imagen no puede superar 5 MB.';
  return '';
}

function SiteVisualAssetModal({
  asset,
  previewUrl,
  fileError,
  mutationError,
  form,
  isSaving,
  onFileChange,
  onFormChange,
  onClose,
  onSubmit,
}) {
  const fallback = assetFallback(asset?.assetKey);
  const imagePreview = previewUrl || assetImage(asset, fallback);
  const title = asset?.title || 'Imagen principal';
  const fileInputId = `site-visual-file-${asset?.assetKey || 'asset'}`;

  return (
    <Modal
      open={Boolean(asset)}
      title={title}
      className="admin-site-visual-modal"
      onClose={onClose}
      closeDisabled={isSaving}
    >
      <form className="admin-modal-form admin-site-visual-form" onSubmit={onSubmit}>
        <div className="admin-site-visual-preview-stage" role="group" aria-label="Previsualizaciones de imagen principal">
          <article className="admin-cover-preview-card">
            <p className="admin-cover-preview-label">Vista hero</p>
            <div className="admin-cover-hero-frame admin-site-visual-hero-frame" style={{ '--admin-preview-position': form.objectPosition }}>
              <SafeImage src={imagePreview} fallback={fallback} alt={`Preview hero ${title}`} />
              <div className="admin-cover-hero-overlay" aria-hidden="true" />
              <div className="admin-cover-hero-copy" aria-hidden="true">
                <span>{asset?.section || 'Seccion'}</span>
                <strong>{title}</strong>
              </div>
            </div>
          </article>

          <article className="admin-cover-preview-card">
            <p className="admin-cover-preview-label">Recorte cuadrado</p>
            <div className="admin-site-visual-square-preview" style={{ '--admin-preview-position': form.objectPosition }}>
              <SafeImage src={imagePreview} fallback={fallback} alt={`Preview cuadrado ${title}`} />
            </div>
          </article>
        </div>

        <div className="admin-site-visual-modal-grid">
          <div className="admin-cover-modal-controls">
            <div className="admin-cover-file-control">
              <input
                id={fileInputId}
                className="admin-cover-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  onFileChange(event.target.files?.[0]);
                  event.target.value = '';
                }}
                disabled={isSaving}
              />
              <label
                className={`button button-ghost button-sm staff-file-button${isSaving ? ' is-disabled' : ''}`}
                htmlFor={fileInputId}
                aria-disabled={isSaving}
              >
                <span className="button-content"><Camera size={14} /> Seleccionar imagen</span>
              </label>
              <p className="admin-modal-hint">Recomendado: 1600 x 1200 px o mayor. JPG, PNG o WEBP hasta 5 MB.</p>
            </div>
          </div>

          <div className="admin-site-visual-fields">
            <Input
              id="site-visual-alt"
              label="Texto alternativo"
              value={form.altText}
              onChange={(event) => onFormChange('altText', event.target.value)}
              maxLength={220}
              hint="Describe la imagen para accesibilidad."
            />
            <Input
              id="site-visual-position"
              label="Encuadre / object-position"
              value={form.objectPosition}
              onChange={(event) => onFormChange('objectPosition', event.target.value)}
              placeholder="center 40%"
              maxLength={80}
              hint="Ejemplos: center, center 35%, 45% 30%."
            />
          </div>
        </div>

        {(fileError || mutationError) && (
          <p className="admin-alert compact">{fileError || mutationError}</p>
        )}

        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}><X size={16} /> Cerrar</Button>
          <Button type="submit" disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function SiteVisualAssetsAdminPage() {
  const queryClient = useQueryClient();
  const assetsQuery = useQuery({
    queryKey: ['site-visual-assets'],
    queryFn: siteVisualAssetService.listAssets,
    staleTime: 1000 * 60 * 10,
  });
  const rows = useMemo(() => assetRows(Array.isArray(assetsQuery.data) ? assetsQuery.data : []), [assetsQuery.data]);
  const configuredCount = rows.filter((asset) => asset.configured).length;
  const categoryCount = rows.filter((asset) => asset.assetKey.startsWith('services.category.')).length;
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [objectUrl, setObjectUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({ altText: '', objectPosition: 'center' });

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const openAsset = (asset) => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl('');
    setSelectedAsset(asset);
    setSelectedFile(null);
    setPreviewUrl('');
    setFileError('');
    setFeedback('');
    setForm({
      altText: asset.altText || asset.title || '',
      objectPosition: assetPosition(asset, asset.objectPosition || 'center'),
    });
  };

  const closeModal = (force = false) => {
    if (!force && assetMutation.isPending) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl('');
    setSelectedAsset(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setFileError('');
  };

  const handleFileChange = (file) => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl('');
    setPreviewUrl('');
    setSelectedFile(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setObjectUrl(nextUrl);
    setPreviewUrl(nextUrl);
    setFileError('');
  };

  const assetMutation = useMutation({
    mutationFn: ({ asset, file, fields }) => siteVisualAssetService.saveAssetImage(asset.assetKey, file, fields),
    onSuccess: (updatedAsset) => {
      queryClient.setQueryData(['site-visual-assets'], (current) => {
        const currentRows = Array.isArray(current) ? current : [];
        const exists = currentRows.some((asset) => asset.assetKey === updatedAsset.assetKey);
        return exists
          ? currentRows.map((asset) => (asset.assetKey === updatedAsset.assetKey ? updatedAsset : asset))
          : [...currentRows, updatedAsset];
      });
      setFeedback('Imagen principal actualizada correctamente.');
      closeModal(true);
    },
    onError: (error) => {
      setFileError(error?.message || 'No fue posible actualizar la imagen principal.');
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedAsset) return;
    if (!selectedFile && !selectedAsset.imageUrl) {
      setFileError('Selecciona una imagen para guardar esta seccion.');
      return;
    }
    if (!form.objectPosition.trim()) {
      setFileError('Define un encuadre valido para la imagen.');
      return;
    }

    assetMutation.mutate({
      asset: selectedAsset,
      file: selectedFile,
      fields: {
        title: selectedAsset.title,
        description: selectedAsset.description,
        altText: form.altText || selectedAsset.title,
        section: selectedAsset.section,
        objectPosition: form.objectPosition,
        active: true,
      },
    });
  };

  return (
    <div className="admin-dashboard admin-site-visual-page">
      <AdminPageHeader
        eyebrow="Contenido visual"
        title="Imagenes principales"
        description="Gestiona heroes y portadas principales visibles en la web publica sin tocar codigo."
        actions={(
          <Button type="button" size="sm" variant="ghost" onClick={() => assetsQuery.refetch()} disabled={assetsQuery.isFetching}>
            <RefreshCw size={16} /> {assetsQuery.isFetching ? 'Actualizando...' : 'Actualizar'}
          </Button>
        )}
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={Image} title="Secciones" value={rows.length} trend={0} microcopy="Assets principales" tone="rose" />
        <AdminKpiCard icon={Sparkles} title="Configuradas" value={configuredCount} trend={0} microcopy="Con imagen personalizada" tone="sage" />
        <AdminKpiCard icon={MonitorSmartphone} title="Categorias" value={categoryCount} trend={0} microcopy="Heroes de servicios" tone="gold" />
      </AdminKpiGrid>

      <section className="admin-panel compact-panel admin-site-visual-panel">
        <header>
          <div>
            <h3>Secciones configurables</h3>
            <p>Si una seccion no tiene imagen propia, el sitio usa el fallback visual existente.</p>
          </div>
        </header>

        {assetsQuery.isError && <p className="admin-alert compact">{assetsQuery.error?.message || 'No fue posible cargar las imagenes principales.'}</p>}
        {feedback && <p className="success-alert compact">{feedback}</p>}

        {assetsQuery.isLoading ? (
          <AdminSkeleton rows={6} />
        ) : (
          <div className="admin-site-visual-grid">
            {rows.map((asset) => {
              const fallback = assetFallback(asset.assetKey);
              const imageUrl = assetImage(asset, fallback);
              return (
                <article className="admin-site-visual-card" key={asset.assetKey}>
                  <div className="admin-site-visual-media" style={{ '--admin-preview-position': asset.objectPosition || 'center' }}>
                    <SafeImage src={imageUrl} fallback={fallback} alt={asset.altText || asset.title} />
                    <span className={asset.configured ? 'admin-cover-status configured' : 'admin-cover-status'}>
                      {asset.configured ? 'Imagen configurada' : 'Usando fallback'}
                    </span>
                  </div>
                  <div className="admin-site-visual-copy">
                    <span className="card-kicker">{asset.section}</span>
                    <strong>{asset.title}</strong>
                    <p>{asset.description}</p>
                    <small>{asset.assetKey} · {asset.objectPosition || 'center'}</small>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => openAsset(asset)}>
                    <Camera size={14} /> Cambiar imagen
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <SiteVisualAssetModal
        asset={selectedAsset}
        previewUrl={previewUrl}
        fileError={fileError}
        mutationError=""
        form={form}
        isSaving={assetMutation.isPending}
        onFileChange={handleFileChange}
        onFormChange={(key, value) => {
          setForm((current) => ({ ...current, [key]: value }));
          setFileError('');
        }}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
