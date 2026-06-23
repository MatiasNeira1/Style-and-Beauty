import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';

export function Modal({ open, title, children, onClose, className = '', closeDisabled = false }) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !closeDisabled) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeDisabled, open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose?.();
      }}
    >
      <section className={`modal ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <Button
            variant="ghost"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
            disabled={closeDisabled}
          >
            <X size={18} />
          </Button>
        </header>
        <div className="modal-body">
          {children}
        </div>
      </section>
    </div>
  );
}
