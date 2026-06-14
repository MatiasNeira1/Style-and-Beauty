import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { CheckoutSummary } from '../../components/shop/CheckoutSummary.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { crearTransaccionWebpay } from '../../services/pagosService.js';
import { reservationService } from '../../services/reservationService.js';
import { firebaseAuthService } from '../../services/firebaseAuthService.js';
import { useCart } from '../../store/CartContext.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import { redirigirAWebpay } from '../../utils/webpayRedirect.js';

function isReservation(item) {
  return item?.type === 'reservation';
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function validateReservationItem(item) {
  if (!isValidUuid(item?.reservationId)) {
    return { message: 'La reserva del carrito ya no es compatible. Selecciona fecha y hora nuevamente.', field: 'reservationId' };
  }
  if (!isValidUuid(item?.serviceId)) {
    return { message: 'La reserva no tiene un servicio valido. Selecciona fecha y hora nuevamente.', field: 'serviceId' };
  }
  if (!isValidUuid(item?.staffId)) {
    return { message: 'La reserva no tiene un profesional valido. Selecciona fecha y hora nuevamente.', field: 'staffId' };
  }
  if (!item?.date) {
    return { message: 'La reserva no tiene fecha. Selecciona fecha y hora nuevamente.', field: 'date' };
  }
  if (!item?.time && !item?.startsAt) {
    return { message: 'La reserva no tiene hora. Selecciona fecha y hora nuevamente.', field: 'time' };
  }
  return null;
}

function validateCartForPayment(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { message: 'Tu carrito esta vacio.', shouldClear: false };
  }

  const invalidReservation = items.find((item) => isReservation(item) && validateReservationItem(item));
  if (invalidReservation) {
    const error = validateReservationItem(invalidReservation);
    return { ...error, shouldClear: true };
  }

  const invalidProduct = items.find((item) => !isReservation(item) && (!item?.idProducto && !item?.id));
  if (invalidProduct) {
    return { message: 'El carrito contiene un producto invalido. Vuelve a agregarlo.', field: 'idProducto', shouldClear: true };
  }

  return null;
}

function cartPayload(items, idCliente) {
  const total = items.reduce((sum, item) => (
    sum + Number(item.price || item.precio || 0) * Number(item.quantity || 1)
  ), 0);

  const reservas = items
    .filter(isReservation)
    .map((item) => ({
      idCita: item.reservationId,
      idServicio: item.serviceId,
      idStaff: item.staffId,
      fecha: item.date,
      horaInicio: item.time || item.startsAt,
      horaFin: item.endsAt,
      precio: Number(item.price || item.precio || 0),
      duracionServicioMin: item.duracionServicioMin ?? item.service?.duracion_minutos ?? item.service?.duracionMinutos,
      holguraMin: item.holguraMin ?? item.service?.holgura_minutos ?? item.service?.holguraMinutos,
    }));

  const productos = items
    .filter((item) => !isReservation(item))
    .map((item) => ({
      idProducto: item.idProducto || item.id,
      nombre: item.name || item.nombre,
      precio: Number(item.price || item.precio || 0),
      cantidad: Number(item.quantity || 1),
    }));

  return {
    idCliente,
    descripcion: 'Carrito Style and Beauty',
    total,
    reservas,
    productos,
  };
}

export function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { setSession } = useAuth();
  const [checkoutError, setCheckoutError] = useState('');
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: reservationService.getMe,
    retry: false,
  });

  const hasItems = items.length > 0;
  const hasReservations = useMemo(() => items.some(isReservation), [items]);
  const canPay = hasItems && !profileQuery.isLoading && !profileQuery.isError && !isStartingPayment;

  const startPayment = async () => {
    setCheckoutError('');
    if (!hasItems) {
      setCheckoutError('Tu carrito esta vacio.');
      return;
    }
    const cartError = validateCartForPayment(items);
    if (cartError) {
      setCheckoutError(cartError.message);
      if (cartError.shouldClear) {
        clearCart();
      }
      return;
    }
    if (!profileQuery.data?.idPersona) {
      setCheckoutError('Completa tu perfil de cliente antes de pagar.');
      return;
    }

    setIsStartingPayment(true);
    try {
      const refreshedSession = await firebaseAuthService.refreshSession();
      if (refreshedSession) {
        setSession(refreshedSession);
      }

      const transaccion = await crearTransaccionWebpay(cartPayload(items, profileQuery.data.idPersona));
      const token = transaccion?.token || transaccion?.tokenWebpay;
      const urlWebpay = transaccion?.urlWebpay || transaccion?.url;

      if (!token || !urlWebpay) {
        throw new Error('No se recibieron los datos de redireccion WebPay.');
      }

      redirigirAWebpay(urlWebpay, token);
    } catch (error) {
      setCheckoutError(error?.message || 'No fue posible iniciar el pago del carrito.');
    } finally {
      setIsStartingPayment(false);
    }
  };

  return (
    <section className="page-section two-column client-view checkout-page">
      <div className="stack">
        <SectionTitle eyebrow="Pago seguro" title="Confirma tu carrito">
          Revisa reservas y productos antes de iniciar el pago total.
        </SectionTitle>

        <Card className="checkout-assurance">
          <ShieldCheck size={24} />
          <div>
            <h3>Pago consolidado</h3>
            <p>WebPay se inicia solo desde el carrito. Las reservas se confirman cuando el pago queda aprobado.</p>
          </div>
        </Card>

        {hasReservations && (
          <p className="admin-alert">
            Las reservas del carrito mantienen su hora retenida por 5 minutos. Si expiran, vuelve a seleccionar horario.
          </p>
        )}

        {profileQuery.isError && (
          <p className="admin-alert">No pudimos cargar tu perfil de cliente. Completa tu perfil antes de pagar.</p>
        )}
        {checkoutError && <p className="admin-alert">{checkoutError}</p>}
      </div>

      <aside className="stack summary-card">
        <CheckoutSummary items={items} />
        <Button disabled={!canPay} onClick={startPayment}>
          <CreditCard size={18} /> {isStartingPayment ? 'Iniciando WebPay...' : 'Pagar carrito'}
        </Button>
      </aside>
    </section>
  );
}
