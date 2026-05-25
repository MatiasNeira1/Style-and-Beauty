import { CheckoutSummary } from '../../components/shop/CheckoutSummary.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useCart } from '../../store/CartContext.jsx';

export function CheckoutPage() {
  const { items, clearCart } = useCart();

  return (
    <section className="page-section">
      <SectionTitle eyebrow="Pago" title="Checkout" />
      <CheckoutSummary items={items} />
      <Button disabled={items.length === 0} onClick={clearCart}>Finalizar compra</Button>
    </section>
  );
}
