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

function cartPayload(items, idCliente) {
  const reservas = items
    .filter(isReservation)
    .map((item) => ({ idCita: item.reservationId }));

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
    reservas,
    productos,
  };
}

export function CheckoutPage() {
  const { items } = useCart();
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
