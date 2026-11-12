import { useRef, useState, type FormEvent } from "react";
import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";
import {
  Choices,
  TextField,
  type FormValues,
} from "../components/ProfileFields";

const languages = [
  "Français",
  "Arabe",
  "Anglais",
  "Allemand",
  "Espagnol",
  "Italien",
];
export function ProfileWizard({ host = false }: { host?: boolean }) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<FormValues>({});
  const [error, setError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  function collect() {
    const data = new FormData(form.current!);
    const next = { ...values };
    for (const element of form.current!.querySelectorAll<HTMLInputElement>(
      "input[name],textarea[name]",
    )) {
      if (element.type === "file") continue;
      next[element.name] =
        element.type === "checkbox"
          ? data.getAll(element.name).map(String)
          : String(data.get(element.name) || "");
    }
    setValues(next);
  }
  function move(next: number) {
    collect();
    setError("");
    setStep(next);
    requestAnimationFrame(() => {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "center" });
    });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    for (const group of form.current!.querySelectorAll<HTMLFieldSetElement>(
      "[data-required-group]",
    )) {
      if (!group.querySelector("input:checked")) {
        setError(
          `Choisissez au moins une option pour « ${group.querySelector("legend")?.textContent?.replace(" *", "")} ».`,
        );
        group.querySelector<HTMLInputElement>("input")?.focus();
        return;
      }
    }
    move(step + 1);
  }
  const titles = host
    ? [
        "Parlez-nous de vous",
        "Informations pratiques",
        "Vérification et paiement",
      ]
    : [
        "À propos de vous",
        "Préférences culinaires",
        "Vos préférences d'expérience",
      ];
  const subtitles = host
    ? [
        "Ces informations aideront les voyageurs à mieux vous connaître",
        "Définissez vos disponibilités et tarifs",
        "Dernière étape pour activer votre profil d'hôte",
      ]
    : Array(3).fill(
        "Aidez-nous à vous proposer les meilleures expériences culinaires",
      );
  return (
    <div className="app pm-inner-page">
      <HomeHeader />
      <main
        className={`pm-wizard${host ? " pm-wizard--host" : ""}${step === 4 ? " pm-wizard--confirmation" : ""}`}
      >
        {host ? (
          <nav className="pm-breadcrumb" aria-label="Fil d’Ariane">
            <a href="#/devenir-hote">Devenir Hôte</a>
            <span>/</span>
            <span>Postuler</span>
          </nav>
        ) : step < 4 ? (
          <h1>Créez votre profil</h1>
        ) : null}
        <ol className="pm-stepper" aria-label="Étapes du profil">
          {[1, 2, 3, 4].map((n) => (
            <li
              key={n}
              aria-current={step === n ? "step" : undefined}
              className={step >= n ? "is-complete" : ""}
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
        {step <= 3 ? (
          <form
            ref={form}
            onSubmit={submit}
            className={`pm-form-card pm-form-card--step-${step}`}
            key={step}
          >
            <header>
              <h2 ref={heading} tabIndex={-1}>
                {titles[step - 1]}
              </h2>
              <p>{subtitles[step - 1]}</p>
            </header>
            {step === 1 && (
              <>
                <div className="pm-field-row">
                  <TextField
                    name="firstName"
                    label="Prénom"
                    values={values}
                    required
                    placeholder="Ex. Fatima"
                  />
                  <TextField
                    name="lastName"
                    label="Nom"
                    values={values}
                    required
                    placeholder="Ex. Kali"
                  />
                </div>
                {host && (
                  <TextField
                    name="city"
                    label="Ville"
                    values={values}
                    required
                    placeholder="Ex. Grenoble"
                  />
                )}
                <Choices
                  name="languages"
                  label="Langues parlées"
                  options={languages}
                  values={values}
                  other
                />
                <TextField
                  name="bio"
                  label={host ? "Présentez-vous" : "Parlez-nous de vous"}
                  values={values}
                  required={host}
                  multiline
                  minLength={host ? 100 : undefined}
                  hint={host ? "Minimum 100 caractères" : "(Optionnel)"}
                  placeholder={
                    host
                      ? "Parlez de votre passion pour la cuisine, votre histoire, ce qui vous motive à partager votre table..."
                      : "Qu'est-ce qui vous attire dans les repas chez l'habitant ? Vos centres d'intérêt, vos passions..."
                  }
                />
              </>
            )}
            {step === 2 &&
              (host ? (
                <>
                  <div className="pm-field-row">
                    <TextField
                      name="capacity"
                      label="Capacité maximale"
                      type="number"
                      min={1}
                      values={values}
                      required
                      placeholder="Ex. 3"
                    />
                    <TextField
                      name="price"
                      label="Prix par personne (moyenne)"
                      type="number"
                      step={0.01}
                      min={0}
                      values={values}
                      required
                      placeholder="€"
                    />
                  </div>
                  <Choices
                    name="days"
                    label="Jours disponibles"
                    options={[
                      "Lundi",
                      "Mardi",
                      "Mercredi",
                      "Jeudi",
                      "Vendredi",
                      "Samedi",
                      "Dimanche",
                    ]}
                    values={values}
                  />
                  <TextField
                    name="details"
                    label="Informations supplémentaires"
                    values={values}
                    multiline
                    placeholder="Accès, parking, informations importantes pour les voyageurs..."
                  />
                </>
              ) : (
                <>
                  <Choices
                    name="diet"
                    label="Préférences culinaires"
                    options={[
                      "Végétarien",
                      "Végan",
                      "Sans gluten",
                      "Sans lactose",
                      "Halal",
                      "Casher",
                    ]}
                    values={values}
                    other
                  />
                  <Choices
                    name="cuisines"
                    label="Cuisine préférées"
                    options={[
                      "Française",
                      "Italienne",
                      "Marocaine",
                      "Japonaise",
                      "Indienne",
                      "Mexicaine",
                      "Libanaise",
                    ]}
                    values={values}
                    other
                  />
                  <TextField
                    name="allergies"
                    label="Allergies alimentaires"
                    values={values}
                    multiline
                    placeholder="Listez vos allergies ou intolérances alimentaires..."
                    hint="(Optionnel)"
                  />
                </>
              ))}
            {step === 3 &&
              (host ? (
                <>
                  <div className="pm-field">
                    <label htmlFor="identity">
                      Pièce d'identité <span>*</span>
                    </label>
                    <label className="pm-upload" htmlFor="identity">
                      <img src="/ready/9df3c.svg" alt="" />
                      <strong>Téléchargez votre pièce d'identité</strong>
                      <small>
                        Carte d'identité, passeport ou permis de conduire
                      </small>
                      <input
                        id="identity"
                        name="identity"
                        type="file"
                        accept="image/*,application/pdf"
                      />
                    </label>
                  </div>
                  <TextField
                    name="iban"
                    label="Coordonnées bancaires"
                    values={values}
                    placeholder="IBAN"
                    hint="Pour recevoir vos paiements (sécurisé via Stripe)"
                  />
                  <div className="pm-fees">
                    <h3>Récapitulatif des frais</h3>
                    <dl>
                      <div>
                        <dt>Commission PlateMate</dt>
                        <dd>15%</dd>
                      </div>
                      <div>
                        <dt>Frais de transaction</dt>
                        <dd>Inclus</dd>
                      </div>
                      <div>
                        <dt>Assurance responsabilité civile</dt>
                        <dd>Incluse</dd>
                      </div>
                    </dl>
                    <small>
                      Exemple: pour un repas à 25€/personne avec 4 invités, vous
                      recevez <span>85€</span>
                    </small>
                  </div>
                  <div className="pm-consents">
                    <label>
                      <input type="checkbox" required name="terms" />
                      J'accepte les conditions d'utilisation et la politique de
                      confidentialité *
                    </label>
                    <label>
                      <input type="checkbox" required name="charter" />
                      J'accepte la charte de l'hôte et m'engage à respecter les
                      règles de sécurité et d'hygiène *
                    </label>
                  </div>
                  <p className="pm-preview-notice">
                    Démonstration : aucun document ni paiement n’est envoyé.
                    Utilisez uniquement des données fictives. L’assurance
                    affichée dans la maquette reste à confirmer.
                  </p>
                </>
              ) : (
                <>
                  <Choices
                    name="experiences"
                    label="Vos préférences d'expérience"
                    options={[
                      "Découvrir de nouvelles cultures",
                      "Rencontrer des locaux",
                      "Manger de la vraie cuisine familiale",
                      "Partager des histoires et expériences",
                      "Apprendre à cuisiner de nouveaux plats",
                      "Voyager autrement",
                    ]}
                    values={values}
                  />
                  <Choices
                    name="atmospheres"
                    label="Type d'ambiance préférée"
                    options={[
                      "Intime (2-4 personnes)",
                      "Conviviale (5-8 personnes)",
                      "Calme et détendue",
                      "Animée et dynamique",
                    ]}
                    values={values}
                  />
                </>
              ))}
            {error && (
              <p role="alert" className="pm-form-error">
                {error}
              </p>
            )}
            <div className="pm-form-actions">
              {step === 1 ? (
                <a href={host ? "#/devenir-hote" : "#/connexion"}>
                  <img src="/ready/b64e3.svg" alt="" />
                  Retour
                </a>
              ) : (
                <button type="button" onClick={() => move(step - 1)}>
                  <img src="/ready/b64e3.svg" alt="" />
                  Retour
                </button>
              )}
              <button className="pm-button pm-button--red" type="submit">
                {step === 3 ? "Confirmer" : "Continuer"}
                <img src="/ready/5b5e3.svg" alt="" />
              </button>
            </div>
          </form>
        ) : (
          <section className="pm-form-card pm-confirmation">
            <img src="/ready/29bf5.svg" alt="" />
            <h2 ref={heading} tabIndex={-1}>
              {host ? "Candidature envoyée !" : "Profil créé !"}
            </h2>
            <p>
              {host
                ? "Merci d'avoir soumis votre candidature pour devenir hôte PlateMate."
                : "Merci d'avoir créé votre profil PlateMate."}
            </p>
            <p className="pm-preview-notice">
              Aperçu de confirmation : aucune donnée n’a été envoyée ni
              enregistrée sur un serveur.
            </p>
            {host && (
              <>
                <p>
                  Notre équipe va vérifier vos informations sous 24 à 48 heures.
                  Vous recevrez un email de confirmation dès que votre profil
                  sera validé.
                </p>
                <div className="pm-next-steps">
                  <h3>Prochaines étapes</h3>
                  {[
                    [
                      "Vérification de votre profil",
                      "Nous vérifions votre identité et vos informations",
                    ],
                    [
                      "Validation et activation",
                      "Vous recevrez un email avec vos accès hôte",
                    ],
                    [
                      "Publiez votre première expérience",
                      "Commencez à accueillir des voyageurs !",
                    ],
                  ].map(([title, description], i) => (
                    <div key={title}>
                      <span>{i + 1}</span>
                      <div>
                        <strong>{title}</strong>
                        <p>{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <a
              className="pm-button pm-button--red"
              href={host ? "#accueil" : "#tables"}
            >
              {host ? "Retour à l'accueil" : "Explorer les expériences"}
            </a>
            {!host && (
              <button type="button" onClick={() => setStep(1)}>
                Mon profil
              </button>
            )}
          </section>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}
