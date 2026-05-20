import { Card } from '../ui/Card.jsx';

export function CheckoutSummary({ items = [] }) {
  const total = items.reduce((sum, item) => sum + Number(item.price || item.precio || 0) * Number(item.quantity || 1), 0);

  return (
    <Card className="summary-card">
      <h3>Pago</h3>
      {items.map((item) => <p key={item.id}>{item.name || item.nombre} x {item.quantity}</p>)}
      <p>Total: ${total}</p>
    </Card>
  );
}
