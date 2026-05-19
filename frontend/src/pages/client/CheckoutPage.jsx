import { CheckoutSummary } from '../../components/shop/CheckoutSummary.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

export function CheckoutPage() {
  return (
    <section className="page-section">
      <SectionTitle title="Checkout" />
      <CheckoutSummary items={[]} />
    </section>
  );
}
