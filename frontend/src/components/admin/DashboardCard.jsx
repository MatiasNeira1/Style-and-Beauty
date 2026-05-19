import { Card } from '../ui/Card.jsx';

export function DashboardCard({ label, value }) {
  return (
    <Card className="dashboard-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}
