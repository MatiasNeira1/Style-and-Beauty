import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ label, id, error, hint, as = 'input', children, ...props }, ref) {
  const Field = as;
  const helperText = error || hint;
  const helperId = helperText && id ? `${id}-helper` : undefined;

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <Field id={id} ref={ref} aria-describedby={helperId} aria-invalid={Boolean(error) || undefined} {...props}>{children}</Field>
      {helperText && <small id={helperId} className={error ? 'field-error' : undefined}>{helperText}</small>}
    </label>
  );
});

