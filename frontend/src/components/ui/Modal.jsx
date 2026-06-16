import { X } from 'lucide-react';
import { Button } from './Button.jsx';

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Cerrar">
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
