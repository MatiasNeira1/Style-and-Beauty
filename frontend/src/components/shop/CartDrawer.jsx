import { CalendarDays, Clock, X } from 'lucide-react';
import { useCart } from '../../store/CartContext.jsx';
import { reservationService } from '../../services/reservationService.js';
import { Button } from '../ui/Button.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function formatRemaining(expiresAt, now) {
  if (!expiresAt) return '';
  const remainingMs = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function isDateTimeLike(value) {
  return typeof value === 'string' && value.includes('T') && !Number.isNaN(Date.parse(value));
}

function formatDate(value) {
  if (!value) return 'Fecha por confirmar';
  const date = isDateTimeLike(value) ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function professionalName(item) {
  const staff = item?.staff || {};
  return `${staff.nombre || ''} ${staff.apellidos || ''}`.trim()
    || staff.fullName
    || item?.professionalName
    || item?.staffName
    || 'Profesional por confirmar';
}

export function CartDrawer() {
  const { items, total, isCartOpen, setIsCartOpen, removeItem, updateQuantity, lastCartError, setLastCartError } = useCart();
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleRemove = async (item) => {
    if (item.type === 'reservation' && item.reservationId) {
      try {
        await reservationService.cancelReservation(item.reservationId);
      } catch {
        // Local removal keeps the cart usable; backend expiry also releases stale reservations.
      }
    }
    removeItem(item.id);
  };

  return (
    <aside className={`cart-drawer ${isCartOpen ? 'is-open' : ''}`} aria-hidden={!isCartOpen}>
      <header>
        <h2>Carrito</h2>
        <Button variant="ghost" onClick={() => setIsCartOpen(false)} aria-label="Cerrar carrito">
          <X size={18} />
        </Button>
      </header>

      <div className="cart-items" data-lenis-prevent>
        {items.length === 0 && <p className="text-center py-8 text-sm text-neutral-400">Tu carrito está vacío.</p>}
        {lastCartError && <p className="admin-alert">{lastCartError}</p>}
        {items.map((item) => (
          <div key={item.id} className="cart-line-enhanced">
            <div className="cart-line-item-wrapper">
              {item.type === 'reservation' ? (
                <div className="cart-item-image cart-reservation-icon">
                  <CalendarDays size={24} />
                </div>
              ) : (
                <SafeImage
                  src={item.imagenUrl || item.imagen || item.image}
                  alt={item.name || item.nombre}
                  className="cart-item-image"
                />
              )}
              <div className="cart-line-details">
                <div className="cart-line-info">
                  <span className="cart-item-name">{item.name || item.nombre}</span>
                  <span className="cart-item-price">${Number(item.price || item.precio || 0).toLocaleString('es-CL')}</span>
                  {item.type === 'reservation' && (
                    <div className="cart-reservation-summary">
                      <span>{professionalName(item)}</span>
                      <span>{formatDate(item.date || item.startsAt)} · {formatTime(item.startsAt || item.time)} - {formatTime(item.endsAt)}</span>
                      <span>{item.duracionServicioMin || item.service?.duracion_minutos || item.service?.duracionMinutos || 'Duracion'} min</span>
                      <span className="cart-item-timer">
                        <Clock size={14} />
                        Expira en {formatRemaining(item.expiresAt, now)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="cart-line-actions">
                  {item.type !== 'reservation' && (
                    <div className="quantity-controls">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label="Restar">-</button>
                      <span>{item.quantity || 1}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label="Sumar">+</button>
                    </div>
                  )}
                  <button type="button" className="cart-remove-btn" onClick={() => handleRemove(item)} aria-label="Quitar">
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer>
        <strong>Total ${total.toLocaleString('es-CL')}</strong>
        <Button disabled={items.length === 0} onClick={() => {
          setLastCartError('');
          setIsCartOpen(false);
          navigate('/checkout');
        }}>Ir a pagar</Button>
      </footer>
    </aside>
  );
}
