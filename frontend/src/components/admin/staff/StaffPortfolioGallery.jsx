import { useCallback, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { SafeImage } from '../../ui/SafeImage.jsx';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function imageId(image) {
  return image.id || image.idFoto || image.idPortfolio;
}

function imageUrl(image) {
  return image.url || image.urlFoto || image.imageUrl;
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se permiten imagenes JPG, PNG o WEBP.';
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'Cada imagen debe pesar 5 MB o menos.';
  }
  return null;
}

export function StaffPortfolioGallery({ images = [], onUpload, onDelete, isUploading, errorMessage }) {
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);
  const previewsRef = useRef([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, []);

  const handleFiles = useCallback(
    (files) => {
      const selectedFiles = Array.from(files || []);
      const validFiles = [];
      const errors = [];

      selectedFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      setLocalError(errors[0] || '');

      validFiles.forEach((file) => {
        const preview = {
          id: `preview-${Date.now()}-${Math.random()}`,
          url: URL.createObjectURL(file),
          file,
          name: file.name,
        };

        setPreviews((current) => [...current, preview]);
        Promise.resolve(onUpload?.(file))
          .then(() => {
            setPreviews((current) => {
              URL.revokeObjectURL(preview.url);
              return current.filter((item) => item.id !== preview.id);
            });
          })
          .catch((error) => {
            setLocalError(error?.message || 'No se pudo subir la imagen.');
          });
      });
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragOver(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles],
  );

  const allImages = [
    ...images.map((image) => ({
      id: imageId(image),
      url: imageUrl(image),
      isUploaded: true,
    })).filter((image) => image.id && image.url),
    ...previews.map((preview) => ({
      id: preview.id,
      url: preview.url,
      isUploaded: false,
      name: preview.name,
    })),
  ];

  return (
    <div className="staff-portfolio-editor">
      <div className="staff-form-section-title">
        <ImageIcon size={14} />
        Trabajos realizados
      </div>

      {(localError || errorMessage) && (
        <p className="admin-alert">
          {localError || errorMessage}
        </p>
      )}

      <div
        className={`staff-dropzone ${dragOver ? 'dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de imagenes"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <Upload size={28} />
        <p>Arrastra imagenes aqui o haz clic para seleccionar</p>
        <span>JPG, PNG o WebP, max. 5 MB por imagen</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
          style={{ display: 'none' }}
        />
      </div>

      {allImages.length > 0 ? (
        <div className="portfolio-grid">
          {allImages.map((image) => (
            <div key={image.id} className="portfolio-item">
              <SafeImage src={image.url} alt={image.name || 'Trabajo realizado'} />
              <div className="portfolio-item-overlay">
                {image.isUploaded ? (
                  <button
                    className="portfolio-delete-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete?.(image.id);
                    }}
                    aria-label="Eliminar imagen"
                    type="button"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <span className="portfolio-uploading-pill">
                    {isUploading ? 'Subiendo...' : 'Procesando...'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="staff-empty-state">
          <ImageIcon size={28} />
          <h3>Aun no hay fotos en tu portfolio</h3>
          <p>Sube trabajos terminados para que aparezcan en tu perfil publico.</p>
        </div>
      )}
    </div>
  );
}
