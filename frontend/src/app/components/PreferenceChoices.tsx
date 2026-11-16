import { useId, useState } from "react";

export function PreferenceChoices({
  label,
  options,
  value,
  onChange,
  required = false,
  custom = true,
  disabled = false,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  custom?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const [extra, setExtra] = useState("");
  const [error, setError] = useState("");
  const choices = [
    ...new Map(
      [...options, ...value].map((s) => [s.toLocaleLowerCase("fr"), s]),
    ).values(),
  ];
  function toggle(option: string) {
    const normalized = option.toLocaleLowerCase("fr");
    if (value.includes(normalized))
      onChange(value.filter((v) => v !== normalized));
    else if (value.length < 24) onChange([...value, normalized]);
    else setError("Vous pouvez choisir jusqu'� 24 �l�ments.");
  }
  function add() {
    const text = extra.trim().toLocaleLowerCase("fr");
    if (!text) return;
    if (!value.includes(text)) {
      if (value.length >= 24) {
        setError("Vous pouvez choisir jusqu'� 24 �l�ments.");
        return;
      }
      onChange([...value, text]);
    }
    setExtra("");
    setError("");
  }
  return (
    <fieldset className="pm-preference-choices" disabled={disabled}>
      <legend>
        {label}
        {required && " *"}
      </legend>
      <div className="pm-profile__choices">
        {choices.map((option) => (
          <button
            key={option.toLocaleLowerCase("fr")}
            type="button"
            aria-pressed={value.includes(option.toLocaleLowerCase("fr"))}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {custom && (
        <div className="pm-preference-choices__custom">
          <label htmlFor={id}>Autre suggestion</label>
          <input
            id={id}
            value={extra}
            maxLength={80}
            placeholder="Ajouter votre choix"
            onChange={(e) => setExtra(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" onClick={add} disabled={!extra.trim()}>
            Ajouter
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}
