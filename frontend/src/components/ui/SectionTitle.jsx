export function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="section-title">
      {eyebrow && <span>{eyebrow}</span>}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
