import { Card } from '../ui/Card.jsx';

export function DashboardCard({ label, value, icon: Icon }) {
  return (
    <Card className="dashboard-card">
      {Icon && <Icon size={22} />}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </Card>
  );
}
