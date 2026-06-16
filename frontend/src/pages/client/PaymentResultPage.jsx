import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { useEffect } from 'react';
import { useCart } from '../../store/CartContext.jsx';

export function PaymentResultPage({ status = 'success' }) {
  const isSuccess = status === 'success';
  const Icon = isSuccess ? CheckCircle2 : XCircle;
  const { clearCart, removeReservationItems } = useCart();

  useEffect(() => {
    if (isSuccess) {
      clearCart();
    } else {
      removeReservationItems();
    }
  }, [clearCart, isSuccess, removeReservationItems]);

  return (
    <section className="page-section standalone-page-section client-view payment-result-page">
      <Card className="summary-card">
        <Icon size={34} />
        <h1>{isSuccess ? 'Pago confirmado' : 'No se pudo confirmar el pago'}</h1>
        <p>
          {isSuccess
            ? 'Tu carrito fue pagado correctamente. Las reservas asociadas quedaron confirmadas.'
            : 'La transaccion fue cancelada o rechazada. Las reservas del carrito fueron liberadas.'}
        </p>
        <Link className="button" to={isSuccess ? '/perfil' : '/checkout'}>
          {isSuccess ? 'Ver mi perfil' : 'Volver al carrito'}
        </Link>
      </Card>
    </section>
  );
}

export function PaymentSuccessPage() {
  return <PaymentResultPage status="success" />;
}

export function PaymentErrorPage() {
  return <PaymentResultPage status="error" />;
}
