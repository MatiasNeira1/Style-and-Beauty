import { CreditCard, ShieldCheck, ShoppingBag } from 'lucide-react';
import { CheckoutSummary } from '../../components/shop/CheckoutSummary.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useCart } from '../../store/CartContext.jsx';
import { useBooking } from '../../store/BookingContext.jsx';

export function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { booking } = useBooking();
  const hasBooking = Boolean(booking?.service);
  const canPay = items.length > 0 || hasBooking;

  return (
    <section className="page-section two-column client-view checkout-page">
      <div className="stack">
        <SectionTitle eyebrow="Pago seguro" title="Confirma tu compra o reserva">
          Revisa el detalle antes de finalizar. Las reservas quedan asociadas a tu perfil y sujetas a confirmacion de pago.
        </SectionTitle>

        {hasBooking && (
          <Card className="checkout-booking-card">
            <CalendarSummary booking={booking} />
          </Card>
        )}

        <Card className="checkout-assurance">
          <ShieldCheck size={24} />
          <div>
            <h3>Confirmacion protegida</h3>
            <p>Tu informacion se usa solo para coordinar la atencion, notificaciones y seguimiento del servicio.</p>
          </div>
        </Card>
      </div>

      <aside className="stack summary-card">
        <CheckoutSummary items={items} />
        <Button disabled={!canPay} onClick={clearCart}>
          <CreditCard size={18} /> Finalizar
        </Button>
      </aside>
    </section>
  );
}

function CalendarSummary({ booking }) {
  return (
    <>
      <span className="card-kicker"><ShoppingBag size={14} /> Reserva seleccionada</span>
      <h3>{booking.service?.nombre || booking.service?.name || 'Servicio'}</h3>
      <p>{booking.staff?.nombre || booking.staff?.name || 'Profesional'} · {booking.date || 'Fecha pendiente'}</p>
    </>
  );
}
