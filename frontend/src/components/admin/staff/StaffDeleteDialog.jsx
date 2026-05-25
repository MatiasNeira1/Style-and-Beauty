import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../ui/Modal.jsx';
import { Button } from '../../ui/Button.jsx';

export function StaffDeleteDialog({ open, staff, onConfirm, onClose, isDeleting }) {
  if (!staff) return null;

  const fullName = `${staff.nombre || ''} ${staff.apellidos || ''}`.trim() || 'este profesional';

  return (
    <Modal open={open} title="Confirmar Eliminación" onClose={onClose}>
      <div className="staff-delete-dialog">
        <AlertTriangle size={40} style={{ color: '#dc2626', margin: '0 auto 0.75rem' }} />
        <p>
          ¿Estás seguro de que deseas eliminar a <strong>{fullName}</strong>?
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>
          Esta acción eliminará el perfil, la jornada laboral y las fotos de trabajos asociados.
          No se puede deshacer.
        </p>
        <div className="staff-delete-actions">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(staff)}
            disabled={isDeleting}
            style={{ background: '#dc2626', boxShadow: '0 16px 34px rgba(220,38,38,0.2)' }}
          >
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
