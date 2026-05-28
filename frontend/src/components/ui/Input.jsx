import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ label, id, error, as = 'input', children, ...props }, ref) {
  const Field = as;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <Field id={id} ref={ref} {...props}>{children}</Field>
      {error && <small>{error}</small>}
    </label>
  );
});

