import { useEffect, useState, type ReactNode } from "react";
import { api, json, errorMessage } from "../api";
import { useSession } from "../Session";
import { suggestions, type Profile } from "../profile";
import { PreferenceChoices } from "./PreferenceChoices";

function ProfileCard({
  title,
  children,
  save,
}: {
  title: string;
  children: ReactNode;
  save: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="pm-profile__section">
      <h2>{title}</h2>
      <form
        className="pm-profile__card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!editing || busy) return;
          setBusy(true);
          setMessage("");
          setError("");
          try {
            await save();
            setEditing(false);
            setMessage("Modifications enregistrées.");
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset className="pm-profile__editable" disabled={!editing || busy}>
          {children}
        </fieldset>
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
            disabled={busy}
            onClick={() => {
              setEditing(true);
              setMessage("");
              setError("");
            }}
          >
            <img src="/account/ce5a3.svg" alt="" />
          </button>
          <button type="submit" disabled={!editing || busy}>
            {busy ? "Enregistrement." : "Enregistrer"}
          </button>
        </div>
        {error && (
          <p role="alert" className="pm-form-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="pm-profile__message">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}

export function ProfileDetails({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const session = useSession();
  const [draft, setDraft] = useState(profile);
  useEffect(() => () => session.setDraftName(""), [session.setDraftName]);
  function change<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
    if (key === "firstName") session.setDraftName(String(value).trim());
  }
  async function save(keys: (keyof Profile)[]) {
    const next = { ...(session.profile ?? profile) };
    for (const key of keys) Object.assign(next, { [key]: draft[key] });
    next.publicInterests = next.publicInterests.filter((v) =>
      next.affinities.includes(v),
    );
    for (const key of ["phone", "birthDate", "neighborhood"] as const)
      if (!next[key]) delete next[key];
    if (
      !next.consent &&
      (next.diets.length || next.allergies.length || next.intolerances.length)
    )
      throw new Error("consent_required");
    const saved = await api<{ profile: Profile }>(
      "/me/profile",
      json("PUT", next),
    );
    session.setProfile(saved.profile);
    session.setDraftName("");
  }
  function field(
    key:
      | "firstName"
      | "lastName"
      | "phone"
      | "birthDate"
      | "city"
      | "neighborhood",
    label: string,
    type = "text",
    required = false,
  ) {
    return (
      <label>
        {label}
        <input
          name={key}
          type={type}
          value={draft[key] ?? ""}
          required={required}
          maxLength={key === "phone" ? 25 : 80}
          onChange={(e) => change(key, e.target.value)}
        />
      </label>
    );
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
        value={draft[key] ?? []}
        onChange={(value) => change(key, value)}
        required={required}
      />
    );
  }
  return (
    <>
      <ProfileCard
        title="Informations personnelles"
        save={() =>
          save([
            "firstName",
            "lastName",
            "city",
            "neighborhood",
            "phone",
            "birthDate",
          ])
        }
      >
        <p className="pm-profile__privacy">
          <img src="/account/fb0e2.svg" alt="" />
          Ces informations restent privées. Les autres membres voient votre
          prénom et l'initiale de votre nom.
        </p>
        <div className="pm-profile__fields">
          {field("firstName", "Prénom", "text", true)}
          {field("lastName", "Nom", "text", true)}
        </div>
        <div className="pm-profile__fields">
          {field("phone", "Téléphone", "tel")}
          <label>
            Email
            <input value={email} type="email" readOnly />
          </label>
          {field("birthDate", "Date de naissance", "date")}
        </div>
        <div className="pm-profile__fields">
          {field("city", "Ville", "text", true)}
          {field("neighborhood", "Quartier")}
        </div>
      </ProfileCard>
      <ProfileCard
        title="À propos de moi"
        save={() =>
          save(["description", "languages", "affinities", "publicInterests"])
        }
      >
        <div className="pm-profile__identity">
          <span className="pm-profile__avatar">
            {profile.firstName[0]}
            {profile.lastName[0]}
          </span>
          <div>
            <strong>
              {profile.firstName} {profile.lastName[0]}.
            </strong>
            <p>
              <img src="/account/e3943.svg" alt="" />
              {profile.city}
            </p>
          </div>
        </div>
        <label className="pm-profile__group">
          <span className="pm-profile__subheading">Ma présentation</span>
          <textarea
            name="description"
            value={draft.description ?? ""}
            maxLength={1000}
            onChange={(e) => change("description", e.target.value)}
          />
        </label>
        {choices("languages", "Langues parlées", true)}
        {choices("affinities", "Mes centres d'intérét", true)}
        <PreferenceChoices
          label="Centres d'intérét visibles sur mon profil public"
          options={draft.affinities}
          value={draft.publicInterests.filter((v) =>
            draft.affinities.includes(v),
          )}
          onChange={(value) => change("publicInterests", value)}
          custom={false}
        />
      </ProfileCard>
      <ProfileCard
        title="Mes préférences"
        save={() =>
          save([
            "diets",
            "allergies",
            "intolerances",
            "cuisines",
            "ambiences",
            "motivations",
            "consent",
          ])
        }
      >
        <p className="pm-profile__subtitle">
          Vos préférences alimentaires restent privées. Le partage de vos
          allergies demande votre accord pour chaque réservation.
        </p>
        <div className="pm-profile__preferences">
          <div>
            {choices("diets", "Régime alimentaire")}
            {choices("allergies", "Allergies")}
            {choices("intolerances", "Intolérances")}
            {choices("cuisines", "Cuisines préférées")}
          </div>
          <div>
            {choices("motivations", "Ce que je recherche")}
            {choices("ambiences", "Ambiance préférée", true)}
          </div>
        </div>
        <label className="pm-consent">
          <input
            type="checkbox"
            checked={draft.consent}
            onChange={(e) => change("consent", e.target.checked)}
          />
          J'accepte l'enregistrement de mes préférences alimentaires pour la
          compatibilité des repas.
        </label>
        <p>
          Pour retirer cet accord, désélectionnez vos régimes, allergies et
          intolérances, puis enregistrez.
        </p>
      </ProfileCard>
    </>
  );
}
