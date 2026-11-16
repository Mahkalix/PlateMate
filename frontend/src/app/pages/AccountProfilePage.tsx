import { useState, type ReactNode } from "react";
import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";
import { AccountHeading } from "../components/AccountHeading";

const interests = [
  "Musique live",
  "Cuisine du monde",
  "Randonnée",
  "Jeux de société",
  "Voyages",
  "Cinéma d'auteur",
  "Photographie",
  "Escalade",
  "Littérature",
];
const initialInterests = ["Randonnée", "Jeux de société", "Cinéma d'auteur"];
const guestPresentation =
  "Étudiante à Grenoble, j'aime découvrir une cuisine à travers les gens qui la font. Toujours partante pour une randonnée le week-end, un film d'auteur ou une longue discussion autour d'un bon repas.";
const hostPresentation =
  "Franco-libanaise, je cuisine les recettes de ma grand-mère de Beyrouth. Chez moi, on mange lentement, on parle fort et on finit souvent la soirée au oud ou autour d'un jeu de société. J'aime rencontrer des gens qui ont des histoires à raconter.";

function EditableCard({
  title,
  children,
  validate,
  subtitle,
}: {
  title: string;
  children: (editing: boolean) => ReactNode;
  validate?: () => string;
  subtitle?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section
      className={`pm-profile__section${title === "À propos de moi" ? " pm-profile__about" : ""}${subtitle ? " pm-profile__guest-preferences" : ""}`}
    >
      <h2>{title}</h2>
      {subtitle && <p className="pm-profile__subtitle">{subtitle}</p>}
      <form
        className="pm-profile__card"
        onSubmit={(event) => {
          event.preventDefault();
          const error = validate?.();
          if (error) {
            setMessage(error);
            return;
          }
          setEditing(false);
          setMessage(
            "Modifications conservées pour cette démonstration uniquement. Aucun envoi au serveur.",
          );
        }}
      >
        {children(editing)}
        <div className="pm-profile__actions">
          {title === "Informations personnelles" && (
            <span className="pm-profile__private-label">
              <img src="/account/ca53b.svg" alt="" />
              Privé, jamais affiché
            </span>
          )}
          <button
            type="button"
            className="pm-profile__edit"
            aria-label={`Modifier ${title}`}
            onClick={() => {
              setEditing(true);
              setMessage("");
            }}
          >
            <img src="/account/ce5a3.svg" alt="" />
          </button>
          <button type="submit" disabled={!editing}>
            Enregistrer
          </button>
        </div>
        {message && (
          <p className="pm-profile__message" role="status">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}

function TagValues({
  title,
  values,
  editing,
}: {
  title: string;
  values: string[];
  editing: boolean;
}) {
  const [text, setText] = useState(values.join(", "));
  return (
    <div className="pm-profile__group">
      <h3>{title}</h3>
      {editing ? (
        <input
          aria-label={title}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      ) : (
        <div className="pm-profile__tags">
          {text
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
            .map((value, index) => (
              <span key={`${index}-${value}`}>{value}</span>
            ))}
        </div>
      )}
    </div>
  );
}

export function AccountProfilePage({ host = false }: { host?: boolean }) {
  const name = host ? "Amina" : "Mikaella";
  const [presentation, setPresentation] = useState(
    host ? hostPresentation : guestPresentation,
  );
  const [selected, setSelected] = useState(initialInterests);
  const [ambiance, setAmbiance] = useState("Calme et intime");
  const [emailNotice, setEmailNotice] = useState(false);
  const stats = host
    ? [
        ["4,9 / 5", "Note moyenne"],
        ["6", "Repas partagés"],
        ["23", "Invités rencontrés"],
      ]
    : [
        ["4", "???"],
        ["3", "Hôtes rencontrés"],
        ["2", "Cuisines découvertes"],
      ];
  return (
    <div className="app pm-inner-page pm-account-page">
      <HomeHeader accountName={name} accountRole={host ? "hote" : "invite"} />
      <main className="pm-account pm-profile">
        <AccountHeading name={name} host={host} active="profile" populated />
        <h2 className="pm-profile__title">Mon profil</h2>
        <div className="pm-profile__stats">
          {stats.map(([number, label]) => (
            <div key={label}>
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="pm-profile__columns">
          <aside className="pm-profile__sidebar">
            {host && (
              <section className="pm-profile__aside-card pm-profile__completion">
                <h3>Profil complété à 90 %</h3>
                <progress value="90" max="100">
                  90 %
                </progress>
                <p>
                  Un profil complet reçoit plus de réservations. Il vous reste :
                </p>
                <button onClick={() => setEmailNotice(true)}>
                  Vérifier votre email <span aria-hidden="true">→</span>
                </button>
                {emailNotice && (
                  <p role="status">
                    La vérification d’email nécessite la connexion Auth0. Aucun
                    email envoyé depuis cette démonstration.
                  </p>
                )}
              </section>
            )}
            <section className="pm-profile__aside-card">
              <h3>Ce que voient les {host ? "invités" : "hôtes"}</h3>
              <p>
                {host
                  ? "Votre profil public aide les invités à choisir une table où ils se sentiront bien. On n'y montre que l'essentiel."
                  : "Votre profil public permet aux hôtes de mieux vous connaître avant de vous accueillir. On n’y montre que l’essentiel."}
              </p>
              <ul>
                {[
                  "Photo, nom et initiale",
                  "Présentation, intérêts et ambiance",
                  ...(host ? ["Votre table, avis et badges"] : []),
                  "Jamais : contact, adresse exacte",
                ].map((text, index, items) => (
                  <li key={text}>
                    <span
                      className={index === items.length - 1 ? "is-private" : ""}
                    >
                      <img
                        src={`/account/${index === items.length - 1 ? "c514b" : "af22f"}.svg`}
                        alt=""
                      />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
          <div className="pm-profile__details">
            <EditableCard title="Informations personnelles">
              {(editing) => (
                <>
                  <p className="pm-profile__privacy">
                    <img src="/account/fb0e2.svg" alt="" />
                    {host
                      ? "Les invités voient seulement votre quartier. L'adresse exacte leur est envoyée une fois la réservation confirmée."
                      : "Ces informations restent privées. Les hôtes voient seulement votre prénom et l'initiale de votre nom."}
                  </p>
                  <div className="pm-profile__fields">
                    {[
                      ["Prénom", name],
                      ["Nom", host ? "Khoury" : "Loppnow"],
                    ].map(([label, value]) => (
                      <label key={label}>
                        {label}
                        <input
                          name={label}
                          defaultValue={value}
                          readOnly={!editing}
                          required
                        />
                      </label>
                    ))}
                  </div>
                  <div className="pm-profile__fields">
                    {[
                      ["Téléphone", "06 •• •• •• 47"],
                      ["Email", host ? "" : "mika@gmail.com"],
                      ["Date de naissance", "12/04/2002"],
                    ].map(([label, value]) => (
                      <label key={label}>
                        {label}
                        <input
                          name={label}
                          defaultValue={value}
                          placeholder={
                            label === "Email" ? "[votre@email.com]" : undefined
                          }
                          type={label === "Email" ? "email" : "text"}
                          readOnly={!editing}
                        />
                      </label>
                    ))}
                  </div>
                </>
              )}
            </EditableCard>
            <EditableCard
              title="À propos de moi"
              validate={() =>
                selected.length < 3
                  ? "Choisissez au moins trois centres d’intérêt."
                  : ""
              }
            >
              {(editing) => (
                <>
                  <div className="pm-profile__identity">
                    <span className="pm-profile__avatar">
                      {host ? "AK" : "ML"}
                    </span>
                    <div>
                      <strong>
                        {name} {host ? "K." : "L."}
                        <img
                          src="/account/9ec3e.svg"
                          alt="Profil vérifié (démonstration)"
                        />
                      </strong>
                      <p>
                        <img src="/account/e3943.svg" alt="" />
                        {host
                          ? "Grenoble, quartier Saint-Bruno · Hôte depuis mars 2026"
                          : "Grenoble · Membre depuis mars 2026"}
                      </p>
                    </div>
                  </div>
                  <label className="pm-profile__group">
                    <span className="pm-profile__subheading">
                      Ma présentation
                    </span>
                    <div className="pm-profile__presentation">
                      <textarea
                        aria-label="Ma présentation"
                        maxLength={400}
                        readOnly={!editing}
                        value={presentation}
                        onChange={(event) =>
                          setPresentation(event.target.value)
                        }
                      />
                      <small>{presentation.length} / 400 caractères</small>
                    </div>
                  </label>
                  {!host && (
                    <TagValues
                      title="Langues parlées"
                      values={["Français", "Arabe", "Anglais"]}
                      editing={editing}
                    />
                  )}
                  <div className="pm-profile__group">
                    <h3>Mes centres d'intérêt</h3>
                    <p>
                      C'est grâce à eux que PlateMate vous propose des{" "}
                      {host ? "invités" : "hôtes"} qui vous ressemblent.
                      Choisissez-en au moins 3.
                    </p>
                    <div className="pm-profile__choices">
                      {interests.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          disabled={!editing}
                          aria-pressed={selected.includes(interest)}
                          onClick={() =>
                            setSelected(
                              selected.includes(interest)
                                ? selected.filter((item) => item !== interest)
                                : [...selected, interest],
                            )
                          }
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                  {host && (
                    <div className="pm-profile__group">
                      <h3>L'ambiance de mes repas</h3>
                      <div className="pm-profile__choices">
                        {["Conviviale", "Festive", "Calme et intime"].map(
                          (value) => (
                            <button
                              key={value}
                              type="button"
                              disabled={!editing}
                              aria-pressed={ambiance === value}
                              onClick={() => setAmbiance(value)}
                            >
                              {value}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </EditableCard>
            <EditableCard
              title={host ? "Ma table" : "Mes préférences"}
              subtitle={
                host
                  ? undefined
                  : "Visible par vous seul. Votre régime et vos allergies sont transmis à l'hôte uniquement quand vous réservez."
              }
            >
              {(editing) => (
                <>
                  <div className="pm-profile__preferences">
                    <div>
                      <TagValues
                        title={host ? "Spécialités" : "Régime alimentaire"}
                        values={
                          host
                            ? ["Libanaise", "Mezze", "Pâtisserie orientale"]
                            : ["Végétarien"]
                        }
                        editing={editing}
                      />
                      <TagValues
                        title={host ? "Régimes possibles" : "Allergies"}
                        values={
                          host
                            ? ["Végétarien", "Halal", "Sans lactose"]
                            : ["Aucun"]
                        }
                        editing={editing}
                      />
                      <TagValues
                        title={host ? "Langues parlées" : "Cuisines préférées"}
                        values={
                          host
                            ? ["Français", "Arabe", "Anglais"]
                            : ["Libanaise", "Japonaise"]
                        }
                        editing={editing}
                      />
                    </div>
                    <div>
                      {host ? (
                        <div className="pm-profile__group">
                          <h3>Infos complementaires :</h3>
                          <textarea
                            aria-label="Infos complémentaires"
                            readOnly={!editing}
                            defaultValue="2 à 6 invités par repas, chat à la maison, 3e étage sans ascenseur"
                          />
                        </div>
                      ) : (
                        <>
                          <TagValues
                            title="Ce que je recherche"
                            values={["Découvrir de nouvelles cultures"]}
                            editing={editing}
                          />
                          <TagValues
                            title="Ambiance préférée"
                            values={["Calme", "Intime (2-4 personnes)"]}
                            editing={editing}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </EditableCard>
          </div>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
