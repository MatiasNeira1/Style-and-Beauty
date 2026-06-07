import { Component } from 'react';
import { useRouteError } from 'react-router-dom';
import { Button } from './Button.jsx';
import { Card } from './Card.jsx';

function reloadPage() {
  window.location.reload();
}

function ErrorCard({ title = 'No fue posible cargar esta vista.', message }) {
  return (
    <section className="page-section route-error-section">
      <Card className="route-error-card">
        <h1>{title}</h1>
        <p>{message || 'Actualiza la página. Si el problema continúa, puede haber un despliegue reciente con caché pendiente.'}</p>
        <Button type="button" onClick={reloadPage}>Recargar</Button>
      </Card>
    </section>
  );
}

export class LazyRouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return <ErrorCard message={this.state.error.message} />;
    }

    return this.props.children;
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  return <ErrorCard message={error?.message || error?.statusText} />;
}
