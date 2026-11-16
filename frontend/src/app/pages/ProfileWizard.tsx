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
        "Votre accord est n�cessaire pour enregistrer vos pr�f�rences alimentaires. Vous pouvez aussi retirer ces choix.",
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
        "Choisissez au moins un centre d'int�r�t, une exp�rience et une ambiance.",
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
    "� propos de vous",
    "Pr�f�rences culinaires",
    "Vos pr�f�rences d'exp�rience",
  ];
  return (
    <div className="app pm-inner-page">
      <HomeHeader />
      <main
        className={`pm-wizard pm-connected-wizard${step === 4 ? " pm-wizard--confirmation" : ""}`}
      >
        {step < 4 && <h1>Cr�ez votre profil</h1>}
        <ol className="pm-stepper" aria-label="�tapes du profil">
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
                Aidez-nous � vous proposer les meilleures exp�riences culinaires
              </p>
            </header>
            <fieldset disabled={busy} className="pm-wizard-fields">
              {step === 1 && (
                <>
                  <div className="pm-field-row">
                    <label className="pm-field">
                      Pr�nom *
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
                  {choices("languages", "Langues parl�es", true)}
                  <label className="pm-field">
                    Parlez-nous de vous
                    <textarea
                      name="description"
                      maxLength={1000}
                      value={values.description}
                      onChange={(e) => change("description", e.target.value)}
                      placeholder="Vos centres d'int�r�t, vos passions, ce qui vous attire dans les repas chez l'habitant."
                    />
                    <small>Optionnel</small>
                  </label>
                </>
              )}
              {step === 2 && (
                <>
                  {choices("diets", "R�gimes alimentaires (facultatif)")}
                  {choices("cuisines", "Cuisines pr�f�r�es")}
                  {choices("allergies", "Allergies alimentaires (facultatif)")}
                  {choices("intolerances", "Intol�rances (facultatif)")}
                  <label className="pm-consent">
                    <input
                      type="checkbox"
                      checked={values.consent}
                      onChange={(e) => change("consent", e.target.checked)}
                    />
                    J'accepte l'enregistrement de mes pr�f�rences alimentaires
                    pour la compatibilit� des repas. Mes allergies ne sont
                    partag�es avec un h�te qu'avec mon accord lors de la
                    r�servation.
                  </label>
                </>
              )}
              {step === 3 && (
                <>
                  {choices("motivations", "Vos pr�f�rences d'exp�rience", true)}
                  {choices("affinities", "Vos centres d'int�r�t", true)}
                  {choices("ambiences", "Type d'ambiance pr�f�r�e", true)}
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
            <span className="pm-confirmation__icon">
              <img src="/ready/29bf5.svg" alt="" />
            </span>
            <div className="pm-confirmation__heading">
              <h2 ref={heading} tabIndex={-1}>
                Profil cr�� !
              </h2>
              <p>
                Merci {values.firstName}, votre profil PlateMate est enregistr�.
              </p>
            </div>
            <div className="pm-confirmation__actions">
              <a className="pm-button pm-button--red" href="#/explorer">
                Explorer les exp�riences
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
