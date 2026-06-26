import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';

export function Modal({
  open,
  title,
  children,
  onClose,
  className = '',
  closeDisabled = false,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
}) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && closeOnEscape && !closeDisabled) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeDisabled, closeOnEscape, open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal((
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && closeOnBackdrop && !closeDisabled) onClose?.();
      }}
    >
      <section className={`modal ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {showCloseButton && (
            <Button
              variant="ghost"
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar modal"
              disabled={closeDisabled}
            >
              <X size={18} />
            </Button>
          )}
        </header>
        <div className="modal-body">
          {children}
        </div>
      </section>
    </div>
  ), document.body);
}
