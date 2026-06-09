import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Modal } from '../ui/Modal.jsx';

export function AuthModal({ open, onClose, onLogin, onRegister }) {
  return (
    <Modal open={open} title="Inicia sesion para reservar" onClose={onClose}>
      <div className="auth-reservation-modal">
        <p>
          Para confirmar tu cita, primero debes iniciar sesion o crear una cuenta. Mantendremos tu seleccion de reserva.
        </p>
        <div className="auth-reservation-actions">
          <Button type="button" onClick={onLogin}>
            <LogIn size={17} />
            Iniciar sesion
          </Button>
          <Button type="button" variant="secondary" onClick={onRegister}>
            <UserPlus size={17} />
            Crear cuenta
          </Button>
        </div>
      </div>
    </Modal>
  );
}
