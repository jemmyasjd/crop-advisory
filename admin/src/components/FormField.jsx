import { useField } from 'formik';

/**
 * Formik-bound input. Supports type=text|number|password|email, textarea, select.
 * Renders label, control, and validation error.
 */
export default function FormField({ label, name, as = 'input', type = 'text', options, ...rest }) {
  const [field, meta] = useField(name);
  const invalid = meta.touched && meta.error;
  const cls = `form-control${invalid ? ' is-invalid' : ''}`;

  return (
    <div className="form-group">
      {label && <label htmlFor={name}>{label}</label>}

      {as === 'textarea' ? (
        <textarea id={name} className={cls} rows={3} {...field} {...rest} />
      ) : as === 'select' ? (
        <select id={name} className={cls} {...field} {...rest}>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input id={name} type={type} className={cls} {...field} {...rest} />
      )}

      {invalid && <div className="field-error">{meta.error}</div>}
    </div>
  );
}
