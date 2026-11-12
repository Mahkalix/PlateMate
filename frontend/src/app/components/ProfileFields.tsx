import { useId } from "react";

export type FormValues = Record<string, string | string[]>;
export function TextField({
  name,
  label,
  values,
  required = false,
  placeholder,
  multiline = false,
  type = "text",
  hint,
  minLength,
  min,
  step,
}: {
  name: string;
  label: string;
  values: FormValues;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  hint?: string;
  minLength?: number;
  min?: number;
  step?: number;
}) {
  const id = useId();
  const props = {
    id,
    name,
    required,
    placeholder,
    defaultValue: String(values[name] || ""),
    minLength,
    "aria-describedby": hint ? `${id}-hint` : undefined,
  };
  return (
    <div className="pm-field">
      <label htmlFor={id}>
        {label}
        {required && <span> *</span>}
      </label>
      {multiline ? (
        <textarea {...props} />
      ) : (
        <input
          {...props}
          type={type}
          min={min}
          step={type === "number" ? (step ?? 1) : undefined}
        />
      )}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function Choices({
  name,
  label,
  options,
  values,
  required = true,
  other = false,
}: {
  name: string;
  label: string;
  options: string[];
  values: FormValues;
  required?: boolean;
  other?: boolean;
}) {
  return (
    <fieldset
      className="pm-choices"
      data-required-group={required ? name : undefined}
    >
      <legend>
        {label}
        {required && <span> *</span>}
      </legend>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input
              type="checkbox"
              name={name}
              value={option}
              defaultChecked={
                Array.isArray(values[name]) && values[name].includes(option)
              }
            />
            {option}
          </label>
        ))}
        {other && (
          <label>
            <input
              type="checkbox"
              name={name}
              value="Autre"
              defaultChecked={
                Array.isArray(values[name]) && values[name].includes("Autre")
              }
            />
            Autre :{" "}
            <input
              className="pm-other"
              aria-label={`Autre : ${label}`}
              name={`${name}Other`}
              defaultValue={String(values[`${name}Other`] || "")}
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}
