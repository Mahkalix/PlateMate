import { useEffect, useRef, useState, type FormEvent } from "react";
import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";
import { PreferenceChoices } from "../components/PreferenceChoices";
import { useSession } from "../Session";
import { api, json, errorMessage } from "../api";
import { emptyProfile, suggestions, type Profile } from "../profile";

export function ProfileWizard() {
  const session = useSession();
  const [values, setValues] = useState<Profile>(
    () => session.profile ?? { ...emptyProfile },
  );
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => () => session.setDraftName(""), [session.setDraftName]);
  function change<K extends keyof Profile>(key: K, value: Profile[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (key === "firstName") session.setDraftName(String(value).trim());
  }
  function choices(
    key: keyof typeof suggestions,
    label: string,
    required = false,
  ) {
    return (
      <PreferenceChoices
        label={label}
        options={suggestions[key]}
        value={values[key] ?? []}
        onChange={(value) => change(key, value)}
        required={required}
      />
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (step === 1 && !values.languages.length) {
      setError("Choisissez au moins une langue.");
      return;
    }
    if (
      step === 2 &&
      !values.consent &&
      (values.diets.length ||
        values.allergies.length ||
        values.intolerances.length)
    ) {
      setError(
        "Votre accord est nécessaire pour enregistrer vos préférences alimentaires. Vous pouvez aussi retirer ces choix.",
      );
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (
      !values.affinities.length ||
      !values.ambiences.length ||
      !values.motivations?.length
    ) {
      setError(
        "Choisissez au moins un centre d'intérêt, une expérience et une ambiance.",
      );
      return;
    }
    setBusy(true);
    try {
      const saved = await api<{ profile: Profile }>(
        "/me/profile",
        json("PUT", values),
      );
      session.setProfile(saved.profile);
      session.setDraftName("");
      setStep(4);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const titles = [
    "À propos de vous",
    "Préférences culinaires",
    "Vos préférences d'expérience",
  ];
  return (
    <div className="app pm-inner-page">
      <HomeHeader />
      <main
        className={`pm-wizard pm-connected-wizard${step === 4 ? " pm-wizard--confirmation" : ""}`}
      >
        {step < 4 && <h1>Créez votre profil</h1>}
        <ol className="pm-stepper" aria-label="Étapes du profil">
          {[1, 2, 3, 4].map((n) => (
            <li
              key={n}
              className={step >= n ? "is-complete" : ""}
              aria-current={step === n ? "step" : undefined}
            >
              <span>
                {n === 4 ? (
                  <img src="/ready/ba7b9.svg" alt="Confirmation" />
                ) : (
                  n
                )}
              </span>
            </li>
          ))}
        </ol>
        {step < 4 ? (
          <form
            className={`pm-form-card pm-form-card--step-${step}`}
            onSubmit={submit}
          >
            <header>
              <h2 ref={heading} tabIndex={-1}>
                {titles[step - 1]}
              </h2>
              <p>
                Aidez-nous à vous proposer les meilleures expériences culinaires
              </p>
            </header>
            <fieldset disabled={busy} className="pm-wizard-fields">
              {step === 1 && (
                <>
                  <div className="pm-field-row">
                    <label className="pm-field">
                      Prénom *
                      <input
                        name="firstName"
                        autoComplete="given-name"
                        required
                        maxLength={80}
                        value={values.firstName}
                        onChange={(e) => change("firstName", e.target.value)}
                      />
                    </label>
                    <label className="pm-field">
                      Nom *
                      <input
                        name="lastName"
                        autoComplete="family-name"
                        required
                        maxLength={80}
                        value={values.lastName}
                        onChange={(e) => change("lastName", e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="pm-field">
                    Ville *
                    <input
                      name="city"
                      autoComplete="address-level2"
                      placeholder="Ex. Grenoble"
                      required
                      maxLength={80}
                      value={values.city}
                      onChange={(e) => change("city", e.target.value)}
                    />
                  </label>
                  {choices("languages", "Langues parlées", true)}
                  <label className="pm-field">
                    Parlez-nous de vous
                    <textarea
                      name="description"
                      maxLength={1000}
                      value={values.description}
                      onChange={(e) => change("description", e.target.value)}
                      placeholder="Vos centres d'intérêt, vos passions, ce qui vous attire dans les repas chez l'habitant."
                    />
                    <small>Optionnel</small>
                  </label>
                </>
              )}
              {step === 2 && (
                <>
                  {choices("diets", "Régimes alimentaires (facultatif)")}
                  {choices("cuisines", "Cuisines préférées")}
                  {choices("allergies", "Allergies alimentaires (facultatif)")}
                  {choices("intolerances", "Intolérances (facultatif)")}
                  <label className="pm-consent">
                    <input
                      type="checkbox"
                      checked={values.consent}
                      onChange={(e) => change("consent", e.target.checked)}
                    />
                    J'accepte l'enregistrement de mes préférences alimentaires
                    pour la compatibilité des repas. Mes allergies ne sont
                    partagées avec un hôte qu'avec mon accord lors de la
                    réservation.
                  </label>
                </>
              )}
              {step === 3 && (
                <>
                  {choices("motivations", "Vos préférences d'expérience", true)}
                  {choices("affinities", "Vos centres d'intérêt", true)}
                  {choices("ambiences", "Type d'ambiance préférée", true)}
                </>
              )}
            </fieldset>
            {error && (
              <p role="alert" className="pm-form-error">
                {error}
              </p>
            )}
            <div className="pm-form-actions">
              {step > 1 ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    setStep(step - 1);
                  }}
                >
                  <img src="/ready/b64e3.svg" alt="" />
                  Retour
                </button>
              ) : (
                <a href="#accueil">
                  <img src="/ready/b64e3.svg" alt="" />
                  Retour
                </a>
              )}
              <button
                type="submit"
                className="pm-button pm-button--red"
                disabled={busy}
              >
                {busy
                  ? "Enregistrement."
                  : step === 3
                    ? "Confirmer"
                    : "Continuer"}
                <img src="/ready/5b5e3.svg" alt="" />
              </button>
            </div>
          </form>
        ) : (
          <section className="pm-form-card pm-confirmation">
            <span
              className="pm-confirmation__icon pm-confirmation__icon--animated"
              aria-hidden="true"
            >
              <svg viewBox="0 0 32 32" width="32" height="32">
                <path
                  d="m8 16 5 5 11-12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength="1"
                />
              </svg>
            </span>
            <div className="pm-confirmation__heading">
              <h2 ref={heading} tabIndex={-1}>
                Profil créé !
              </h2>
              <p>
                Merci {values.firstName}, votre profil PlateMate est enregistré.
              </p>
            </div>
            <div className="pm-confirmation__actions">
              <a className="pm-button pm-button--red" href="#/explorer">
                Explorer les expériences
              </a>
              <a
                className="pm-button pm-button--outline"
                href="#/mon-profil/invite"
              >
                Mon profil
              </a>
            </div>
          </section>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}
