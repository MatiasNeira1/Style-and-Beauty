import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { SafeImage } from '../../ui/SafeImage.jsx';

export function StaffPortfolioGallery({ images = [], onUpload, onDelete }) {
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(
    (files) => {
      const validFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );

      // Generate local previews
      const newPreviews = validFiles.map((file) => ({
        id: `preview-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
        name: file.name,
      }));
      setPreviews((prev) => [...prev, ...newPreviews]);

      // Upload each file
      validFiles.forEach((file) => {
        onUpload(file).then(() => {
          // Remove preview after successful upload
          setPreviews((prev) => prev.filter((p) => p.file !== file));
        }).catch(() => {
          // Keep preview on error so user can retry
        });
      });
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const allImages = [
    ...images.map((img) => ({
      id: img.id || img.idPortfolio,
      url: img.url || img.imageUrl,
      isUploaded: true,
    })),
    ...previews.map((p) => ({
      id: p.id,
      url: p.url,
      isUploaded: false,
      name: p.name,
    })),
  ];

  return (
    <div className="card stack">
      <div className="staff-form-section-title">
        <ImageIcon size={14} />
        Trabajos Realizados
      </div>

      {/* ── Dropzone ────────────────────────────── */}
      <div
        className={`staff-dropzone ${dragOver ? 'dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de imágenes"
      >
        <Upload size={28} />
        <p>Arrastra las imágenes aquí o haz clic para seleccionar</p>
        <span>JPG, PNG, WebP — máx. 5MB por imagen</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* ── Gallery Grid ────────────────────────── */}
      {allImages.length > 0 && (
        <div className="portfolio-grid">
          {allImages.map((img) => (
            <div key={img.id} className="portfolio-item">
              <SafeImage
                src={img.url}
                alt={img.name || 'Trabajo realizado'}
              />
              <div className="portfolio-item-overlay">
                {img.isUploaded ? (
                  <button
                    className="portfolio-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(img.id);
                    }}
                    aria-label="Eliminar imagen"
                    type="button"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      borderRadius: '999px',
                      color: 'var(--color-primary)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.3rem 0.6rem',
                    }}
                  >
                    Subiendo…
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {allImages.length === 0 && (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1rem 0' }}>
          Aún no hay fotos de trabajos realizados.
        </p>
      )}
    </div>
  );
}
