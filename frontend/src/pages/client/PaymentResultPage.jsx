import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';

export function PaymentResultPage({ status = 'success' }) {
  const isSuccess = status === 'success';
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <section className="page-section client-view">
      <Card className="summary-card">
        <Icon size={34} />
        <h1>{isSuccess ? 'Pago confirmado' : 'No se pudo confirmar el pago'}</h1>
        <p>
          {isSuccess
            ? 'Tu reserva fue recibida y estamos validando la confirmacion del pago.'
            : 'La transaccion fue cancelada o rechazada. Puedes volver a intentar la reserva.'}
        </p>
        <Link className="button" to={isSuccess ? '/perfil' : '/reservar'}>
          {isSuccess ? 'Ver mi perfil' : 'Volver a reservar'}
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
