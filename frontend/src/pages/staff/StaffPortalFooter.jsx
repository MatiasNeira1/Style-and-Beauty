export function StaffPortalFooter() {
  return (
    <footer className="footer" style={{ borderTop: '1px solid rgba(25, 20, 23, 0.08)', marginTop: '4rem', padding: '2.5rem 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', width: '100%' }}>
      <div>
        <strong style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-primary)', fontSize: '1.25rem', display: 'block', marginBottom: '0.2rem' }}>
          Style & Beauty
        </strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', margin: 0 }}>
          Salón premium, agenda inteligente y cuidado profesional.
        </p>
      </div>
      <div className="footer-links" style={{ display: 'flex', gap: '1.5rem' }}>
        <a href="/servicios" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink-soft)' }}>Servicios</a>
        <a href="/productos" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink-soft)' }}>Productos</a>
        <a href="/contacto" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink-soft)' }}>Contacto</a>
      </div>
    </footer>
  );
}
