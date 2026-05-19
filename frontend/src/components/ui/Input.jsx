export function Input({ label, id, error, as = 'input', ...props }) {
  const Field = as;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <Field id={id} {...props} />
      {error && <small>{error}</small>}
    </label>
  );
}
