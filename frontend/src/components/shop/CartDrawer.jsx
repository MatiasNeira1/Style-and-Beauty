import { CalendarDays, Clock, Trash2, X } from 'lucide-react';
import { useCart } from '../../store/CartContext.jsx';
import { reservationService } from '../../services/reservationService.js';
import { Button } from '../ui/Button.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  formatCLP,
  getCartItemServiceValue,
  getCartItemUnitPayable,
  getReservationDeposit,
} from '../../utils/priceUtils.js';

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
  const { items, total, isCartOpen, setIsCartOpen, cartTriggerRef, removeItem, updateQuantity, clearCart, lastCartError, setLastCartError } = useCart();
  const [now, setNow] = useState(Date.now());
  const [clearingCart, setClearingCart] = useState(false);
  const drawerRef = useRef(null);
  const navigate = useNavigate();

  const moveFocusOutOfDrawer = useCallback(() => {
    if (typeof document === 'undefined') return;

    const activeElement = document.activeElement;
    if (!activeElement || !drawerRef.current?.contains(activeElement)) return;

    const trigger = cartTriggerRef?.current;
    if (trigger?.isConnected && typeof trigger.focus === 'function' && !trigger.disabled) {
      trigger.focus({ preventScroll: true });
      return;
    }

    if (typeof activeElement.blur === 'function') {
      activeElement.blur();
    }
  }, [cartTriggerRef]);

  const closeCart = useCallback(() => {
    moveFocusOutOfDrawer();
    setIsCartOpen(false);
  }, [moveFocusOutOfDrawer, setIsCartOpen]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isCartOpen) moveFocusOutOfDrawer();
  }, [isCartOpen, moveFocusOutOfDrawer]);

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

  const handleClearCart = async () => {
    if (!items.length || clearingCart) return;
    const confirmed = window.confirm('¿Vaciar todo el carrito? Se eliminarán productos y reservas temporales.');
    if (!confirmed) return;

    setClearingCart(true);
    setLastCartError('');
    const reservations = items.filter((item) => item.type === 'reservation' && item.reservationId);
    const results = await Promise.allSettled(
      reservations.map((item) => reservationService.cancelReservation(item.reservationId)),
    );
    clearCart();
    if (results.some((result) => result.status === 'rejected')) {
      setLastCartError('Vaciamos el carrito localmente, pero alguna reserva temporal no pudo cancelarse en el backend. Se liberará al expirar si sigue pendiente.');
    }
    setClearingCart(false);
  };

  return (
    <aside
      ref={drawerRef}
      className={`cart-drawer ${isCartOpen ? 'is-open' : ''}`}
      role="dialog"
      aria-modal={isCartOpen ? 'true' : undefined}
      aria-label="Carrito"
      aria-hidden={!isCartOpen}
      inert={isCartOpen ? undefined : ''}
    >
      <header>
        <h2>Carrito</h2>
        <div className="cart-header-actions">
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="cart-clear-button"
              onClick={handleClearCart}
              disabled={clearingCart}
              aria-label="Vaciar carrito"
            >
              <Trash2 size={15} />
              {clearingCart ? 'Vaciando...' : 'Vaciar'}
            </Button>
          )}
          <Button variant="ghost" onClick={closeCart} aria-label="Cerrar carrito">
            <X size={18} />
          </Button>
        </div>
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
                  <span className="cart-item-price">
                    {item.type === 'reservation'
                      ? `Valor servicio: ${formatCLP(getCartItemServiceValue(item))}`
                      : formatCLP(getCartItemUnitPayable(item))}
                  </span>
                  {item.type === 'reservation' && (
                    <div className="cart-reservation-summary">
                      <span>{professionalName(item)}</span>
                      <span>{formatDate(item.date || item.startsAt)} · {formatTime(item.startsAt || item.time)} - {formatTime(item.endsAt)}</span>
                      <span>Abono WebPay: {formatCLP(getReservationDeposit(item))}</span>
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
        <strong>Total a abonar hoy {formatCLP(total)}</strong>
        {items.some((item) => item.type === 'reservation') && <small>Saldo restante se paga en el local.</small>}
        <Button disabled={items.length === 0 || clearingCart} onClick={() => {
          setLastCartError('');
          closeCart();
          navigate('/checkout');
        }}>Ir a pagar</Button>
      </footer>
    </aside>
  );
}
