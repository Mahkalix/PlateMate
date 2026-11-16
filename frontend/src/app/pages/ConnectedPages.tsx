import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api, errorMessage, json } from "../api";
import { useSession } from "../Session";
import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";
import { ProfileDetails } from "../components/ProfileDetails";
import type { Profile } from "../profile";

type Summary = {
  isHost: boolean;
  email: string;
  mealsHosted: number;
  hostsMet: number;
  guestsMet: number;
};
type Table = {
  specialties: string[];
  supportedDiets: string[];
  languages: string[];
  additionalInformation: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    instructions: string;
  } | null;
};
type Card = {
  hostId: string;
  contextId: string;
  contextTitle: string;
  firstName: string;
  city: string;
  kind: string;
  ambience: string;
  description?: string;
  contributionCents?: number;
  slots?: { id: string; startsAt: string; remainingPlaces: number }[];
};
type Booking = {
  id: string;
  slotId: string;
  status: string;
  contextTitle: string;
  counterpartName: string;
  startsAt: string;
  partySize: number;
  amountCents: number;
  paymentIntentStatus: string;
};
type Meal = {
  id?: string;
  slotId: string;
  title: string;
  startsAt: string;
  status?: string;
  confirmedPlaces?: number;
  capacity?: number;
  pendingRequests?: number;
  myRating?: number;
  address?: Table["address"];
};
type MealResponse = {
  isHost: boolean;
  sections: { upcoming: Meal[]; past: Meal[]; cancelled: Meal[] };
  limit: number;
  offset: number;
};
const tags = (value: FormDataEntryValue | null) => [
  ...new Set(
    String(value || "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
  ),
];
const date = (value: string) =>
  new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const statusLabel: Record<string, string> = {
  pending: "En attente",
  accepted: "Accept�e",
  declined: "Refus�e",
  cancelled: "Annul�e",
  completed: "Termin�e",
};

function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let current = true;
    setData(null);
    setError("");
    api<T>(path)
      .then((value) => {
        if (current) setData(value);
      })
      .catch((e) => {
        if (current) setError(errorMessage(e));
      });
    return () => {
      current = false;
    };
  }, [path, version]);
  return { data, error, reload: () => setVersion((n) => n + 1) };
}

function Shell({
  title,
  children,
  name,
}: {
  title: string;
  children: ReactNode;
  name?: string;
}) {
  const session = useSession();
  name = session.draftName || session.profile?.firstName || name;
  const route = window.location.hash;
  const accountPage =
    /^#\/(mon-profil|mes-repas|profil|candidature)(\/|$)/.test(route);
  const role =
    route.includes("/hote") || route === "#/candidature" ? "hote" : "invite";
  const meals = route.startsWith("#/mes-repas");
  return (
    <div
      className={`app pm-inner-page${accountPage ? " pm-account-page" : ""}`}
    >
      <HomeHeader accountRole={role} accountName={name} />
      <main
        className={
          accountPage
            ? `pm-account ${meals ? "pm-live pm-history" : "pm-profile"}`
            : "pm-live"
        }
      >
        {!accountPage && <h1>{title}</h1>}
        {accountPage && (
          <>
            <div className="pm-account__heading">
              <h1>{name ? `Bonjour ${name}` : "Mon compte"}</h1>
              <nav className="pm-account__tabs" aria-label="Mon compte">
                <a
                  href={`#/mon-profil/${role}`}
                  aria-current={!meals ? "page" : undefined}
                >
                  Profil
                </a>
                <a
                  href={`#/mes-repas/${role}`}
                  aria-current={meals ? "page" : undefined}
                >
                  Mes repas
                </a>
              </nav>
            </div>
            <nav className="pm-account__role" aria-label="Choisir mon espace">
              <a
                href={`#/${meals ? "mes-repas" : "mon-profil"}/invite`}
                aria-current={role === "invite" ? "true" : undefined}
              >
                Espace invit�
              </a>
              <a
                href={`#/${meals ? "mes-repas" : "mon-profil"}/hote`}
                aria-current={role === "hote" ? "true" : undefined}
              >
                Espace h�te
              </a>
            </nav>
          </>
        )}
        {accountPage && (
          <h2 className={meals ? undefined : "pm-profile__title"}>{title}</h2>
        )}
        {children}
      </main>
      <HomeFooter />
    </div>
  );
}
function LoadState({ error, retry }: { error: string; retry: () => void }) {
  return error ? (
    <div>
      <p role="alert">{error}</p>
      <button onClick={retry}>R�essayer</button>
    </div>
  ) : (
    <p role="status">Chargement.</p>
  );
}
function Field({
  name,
  label,
  value = "",
  type = "text",
  required = false,
  maxLength = 80,
}: {
  name: string;
  label: string;
  value?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="pm-field">
      {label}
      <input
        name={name}
        defaultValue={value}
        type={type}
        required={required}
        maxLength={maxLength}
      />
    </label>
  );
}
function ActionForm({
  children,
  submit,
  success = "Enregistr�.",
  after,
  disabled = false,
}: {
  children: ReactNode;
  submit: (data: FormData) => Promise<unknown>;
  success?: string;
  after?: () => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function handle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || disabled) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await submit(data);
      setMessage(success);
      after?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="pm-form-card" onSubmit={handle}>
      <fieldset disabled={busy || disabled}>
        {children}
        <button className="pm-button" type="submit">
          {busy ? "Envoi." : "Valider"}
        </button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </form>
  );
}

export function ConnectedProfile({ host = false }: { host?: boolean }) {
  const session = useSession();
  const summary = useLoad<Summary>("/me/account-summary");
  const p = session.profile;
  if (!p || !summary.data)
    return (
      <Shell title="Mon profil">
        <LoadState error={summary.error} retry={summary.reload} />
      </Shell>
    );
  return (
    <Shell title="Mon profil" name={p.firstName}>
      <div className="pm-profile__stats">
        <div>
          <strong>{summary.data.hostsMet}</strong>
          <span>H�tes rencontr�s</span>
        </div>
        <div>
          <strong>{summary.data.mealsHosted}</strong>
          <span>Repas accueillis</span>
        </div>
        <div>
          <strong>{summary.data.guestsMet}</strong>
          <span>Invit�s rencontr�s</span>
        </div>
      </div>
      <div className="pm-profile__columns">
        <aside className="pm-profile__sidebar">
          <section className="pm-profile__aside-card">
            <h3>Ce que voient les {host ? "invit�s" : "h�tes"}</h3>
            <p>
              Votre profil public aide les autres membres � mieux vous
              conna�tre.
            </p>
            <ul>
              {[
                "Pr�nom et initiale",
                "Pr�sentation et int�r�ts publics",
                "Jamais : coordonn�es et adresse exacte",
              ].map((label, i) => (
                <li key={label}>
                  <span className={i === 2 ? "is-private" : ""}>
                    <img
                      src={
                        i === 2 ? "/account/c514b.svg" : "/account/af22f.svg"
                      }
                      alt=""
                    />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </section>
        </aside>
        <div className="pm-profile__details">
          <ProfileDetails profile={p} email={summary.data.email} />
          {host &&
            (summary.data.isHost ? (
              <TableForm />
            ) : (
              <ActionForm
                success="Profil h�te cr��."
                after={summary.reload}
                submit={() => api("/me/host", json("POST", {}))}
              >
                <h2>Devenir h�te</h2>
                <p>
                  Votre profil est pr�t. Activez votre espace h�te pour proposer
                  une table.
                </p>
              </ActionForm>
            ))}
        </div>
      </div>
    </Shell>
  );
}

function TableForm() {
  const state = useLoad<{ table: Partial<Table> }>("/me/table");
  if (!state.data)
    return <LoadState error={state.error} retry={state.reload} />;
  const t = state.data.table;
  return (
    <ActionForm
      submit={(data) =>
        api(
          "/me/table",
          json("PUT", {
            specialties: tags(data.get("specialties")),
            supportedDiets: tags(data.get("supportedDiets")),
            languages: tags(data.get("tableLanguages")),
            additionalInformation: String(data.get("additionalInformation")),
            address: data.get("street")
              ? {
                  street: String(data.get("street")),
                  postalCode: String(data.get("postalCode")),
                  city: String(data.get("tableCity")),
                  instructions: String(data.get("instructions")),
                }
              : null,
          }),
        )
      }
    >
      <h2>Ma table</h2>
      <p>
        Votre adresse est r�serv�e aux invit�s dont la r�servation est accept�e.
      </p>
      <Field
        name="specialties"
        label="Sp�cialit�s (virgules)"
        value={t.specialties?.join(", ")}
        maxLength={1944}
      />
      <Field
        name="supportedDiets"
        label="R�gimes propos�s (virgules)"
        value={t.supportedDiets?.join(", ")}
        maxLength={1944}
      />
      <Field
        name="tableLanguages"
        label="Langues de la table (virgules)"
        value={t.languages?.join(", ")}
        required
        maxLength={1944}
      />
      <Field
        name="additionalInformation"
        label="Informations compl�mentaires"
        value={t.additionalInformation}
        maxLength={1000}
      />
      <Field
        name="street"
        label="Rue (laisser vide pour retirer l'adresse)"
        value={t.address?.street}
        maxLength={200}
      />
      <Field
        name="postalCode"
        label="Code postal"
        value={t.address?.postalCode}
        maxLength={20}
      />
      <Field
        name="tableCity"
        label="Ville de la table"
        value={t.address?.city}
      />
      <Field
        name="instructions"
        label="Instructions d'acc�s"
        value={t.address?.instructions}
        maxLength={500}
      />
    </ActionForm>
  );
}

export function ConnectedExplorer() {
  const [offset, setOffset] = useState(0);
  const state = useLoad<{
    items: Card[];
    total: number;
    nextOffset: number | null;
  }>(`/explorer?offset=${offset}`);
  return (
    <Shell title="Explorer les exp�riences">
      {!state.data ? (
        <LoadState error={state.error} retry={state.reload} />
      ) : (
        <>
          {!state.data.items.length && (
            <p>
              Aucune exp�rience compatible pour le moment. V�rifiez que{" "}
              <a href="#/mon-profil/invite">votre profil</a> est compl�t�.
            </p>
          )}
          <div className="pm-live__grid">
            {state.data.items.map((card) => (
              <article className="pm-form-card" key={card.contextId}>
                <h2>{card.contextTitle}</h2>
                <p>
                  Chez {card.firstName} � {card.city}
                </p>
                <p>
                  {card.kind} � {card.ambience}
                </p>
                <a
                  className="pm-button"
                  href={`#/experience/${card.hostId}/${card.contextId}`}
                >
                  Voir les disponibilit�s
                </a>
              </article>
            ))}
          </div>
          {offset > 0 && (
            <button onClick={() => setOffset(Math.max(0, offset - 20))}>
              Pr�c�dent
            </button>
          )}
          {state.data.nextOffset !== null && (
            <button onClick={() => setOffset(state.data!.nextOffset!)}>
              Suivant
            </button>
          )}
        </>
      )}
    </Shell>
  );
}

export function Experience({
  hostId,
  contextId,
}: {
  hostId: string;
  contextId: string;
}) {
  const state = useLoad<Card>(
    `/profiles/${encodeURIComponent(hostId)}/contexts/${encodeURIComponent(contextId)}`,
  );
  return (
    <Shell title={state.data?.contextTitle || "Exp�rience"}>
      {!state.data ? (
        <LoadState error={state.error} retry={state.reload} />
      ) : (
        <>
          <p>
            Chez {state.data.firstName} � {state.data.city}
          </p>
          <p>{state.data.description}</p>
          <p>
            Participation par personne :{" "}
            {((state.data.contributionCents || 0) / 100).toLocaleString(
              "fr-FR",
              { style: "currency", currency: "EUR" },
            )}
          </p>
          {!state.data.slots?.length && <p>Aucun cr�neau disponible.</p>}
          {state.data.slots?.map((slot) => (
            <ActionForm
              key={slot.id}
              disabled={slot.remainingPlaces < 1}
              success="Demande envoy�e � l'h�te. Retrouvez-la dans Mes repas."
              submit={(data) =>
                api(
                  "/bookings",
                  json("POST", {
                    slotId: slot.id,
                    partySize: Number(data.get("partySize")),
                  }),
                )
              }
            >
              <h2>{date(slot.startsAt)}</h2>
              <p>{slot.remainingPlaces} places disponibles</p>
              <label>
                Nombre de personnes
                <input
                  name="partySize"
                  type="number"
                  defaultValue={1}
                  min={1}
                  max={slot.remainingPlaces}
                  required
                  disabled={slot.remainingPlaces < 1}
                />
              </label>
              {slot.remainingPlaces < 1 && <p>Ce cr�neau est complet.</p>}
            </ActionForm>
          ))}
          <a href="#/mes-repas/invite">Voir mes demandes</a>
        </>
      )}
    </Shell>
  );
}

export function ConnectedMeals({ host = false }: { host?: boolean }) {
  const [offset, setOffset] = useState(0);
  const state = useLoad<MealResponse>(
    `/me/meals?view=${host ? "host" : "guest"}&offset=${offset}`,
  );
  const bookings = useLoad<{ items: Booking[] }>(
    `/me/bookings?view=${host ? "host" : "guest"}`,
  );
  const reload = () => {
    state.reload();
    bookings.reload();
  };
  return (
    <Shell title={host ? "Les repas que j'accueille" : "Mes repas invit�s"}>
      {!state.data || !bookings.data ? (
        <LoadState error={state.error || bookings.error} retry={reload} />
      ) : (
        <>
          {host && !state.data.isHost && (
            <p>
              <a href="#/mon-profil/hote">Activer mon profil h�te</a>
            </p>
          )}
          {host && state.data.isHost && <PublishMeal after={reload} />}
          {offset === 0 &&
            Object.values(state.data.sections).every(
              (items) => !items.length,
            ) &&
            !bookings.data.items.length && (
              <section className="pm-form-card">
                <h3>
                  {host
                    ? "Vous n'avez pas encore accueilli de repas"
                    : "Vous n'avez pas encore r�serv� de repas"}
                </h3>
                {!host && (
                  <a className="pm-button" href="#/explorer">
                    Explorer les repas
                  </a>
                )}
              </section>
            )}
          <div className="pm-meals__sections">
            {(
              [
                ["upcoming", "� venir"],
                ["past", "Repas pass�s"],
                ["cancelled", "Annul�s ou refus�s"],
              ] as const
            ).map(([section, title]) => (
              <section className="pm-meals__section" key={section}>
                <h2>{title}</h2>
                {!state.data!.sections[section].length && (
                  <p>Aucun repas dans cette rubrique.</p>
                )}
                <div className="pm-history__list">
                  {state.data!.sections[section].map((meal) => (
                    <article
                      className="pm-history__row"
                      key={meal.id || meal.slotId}
                    >
                      <div>
                        <h3>{meal.title}</h3>
                        <p>{date(meal.startsAt)}</p>
                        {meal.status && <p>{statusLabel[meal.status]}</p>}
                        {host && (
                          <p>
                            {meal.confirmedPlaces}/{meal.capacity} places
                            confirm�es � {meal.pendingRequests} demandes
                          </p>
                        )}
                        {meal.address && (
                          <p>
                            Adresse : {meal.address.street},{" "}
                            {meal.address.postalCode} {meal.address.city}.{" "}
                            {meal.address.instructions}
                          </p>
                        )}
                        {!host &&
                          meal.id &&
                          ["pending", "accepted"].includes(
                            meal.status || "",
                          ) && <AllergyConsent bookingId={meal.id} />}
                        {!host &&
                          meal.id &&
                          meal.status === "completed" &&
                          (meal.myRating ? (
                            <p>Votre note : {meal.myRating}/5</p>
                          ) : (
                            <ActionForm
                              after={reload}
                              submit={(data) =>
                                api(
                                  `/bookings/${meal.id}/review`,
                                  json("POST", {
                                    rating: Number(data.get("rating")),
                                    comment: String(data.get("comment")),
                                  }),
                                )
                              }
                            >
                              <h3>Votre avis</h3>
                              <label>
                                Note sur 5
                                <input
                                  name="rating"
                                  type="number"
                                  min={1}
                                  max={5}
                                  required
                                />
                              </label>
                              <Field
                                name="comment"
                                label="Commentaire"
                                maxLength={1000}
                                required
                              />
                            </ActionForm>
                          ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
          {offset > 0 && (
            <button onClick={() => setOffset(Math.max(0, offset - 50))}>
              Repas pr�c�dents
            </button>
          )}
          {Object.values(state.data.sections).flat().length === 50 && (
            <button onClick={() => setOffset(offset + 50)}>
              Repas suivants
            </button>
          )}
          <section>
            <h2>{host ? "G�rer les demandes" : "Mes r�servations"}</h2>
            {bookings.data.items.map((booking) => (
              <BookingActions
                key={booking.id}
                booking={booking}
                host={host}
                after={reload}
              />
            ))}
          </section>
        </>
      )}
    </Shell>
  );
}

function BookingActions({
  booking: b,
  host,
  after,
}: {
  booking: Booking;
  host: boolean;
  after: () => void;
}) {
  const actions =
    b.status === "pending"
      ? host
        ? ["accepted", "declined"]
        : ["cancelled"]
      : b.status === "accepted"
        ? host
          ? Date.parse(b.startsAt) <= Date.now()
            ? ["completed", "cancelled"]
            : ["cancelled"]
          : ["cancelled"]
        : [];
  return (
    <article className="pm-form-card">
      <h3>{b.contextTitle}</h3>
      <p>
        {b.counterpartName} � {b.partySize} personnes � {statusLabel[b.status]}
      </p>
      {actions.length > 0 && (
        <ActionForm
          after={after}
          submit={(data) =>
            api(
              `/bookings/${b.id}/status`,
              json("PATCH", { status: data.get("status") }),
            )
          }
        >
          <label>
            Action
            <select name="status">
              {actions.map((status) => (
                <option value={status} key={status}>
                  {
                    (
                      {
                        accepted: "Accepter",
                        declined: "Refuser",
                        cancelled: "Annuler",
                        completed: "Marquer termin�",
                      } as Record<string, string>
                    )[status]
                  }
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
      )}
      {host && b.status === "accepted" && <SharedAllergies bookingId={b.id} />}
      {!host &&
        b.status === "accepted" &&
        b.paymentIntentStatus !== "paid" &&
        b.amountCents > 0 && (
          <ActionForm
            after={after}
            success="Paiement enregistr�."
            submit={() =>
              api(`/bookings/${b.id}/payment-intent`, { method: "POST" })
            }
          >
            <p>
              R�gler{" "}
              {(b.amountCents / 100).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}{" "}
              avec le solde de votre portefeuille.
            </p>
          </ActionForm>
        )}
    </article>
  );
}
function AllergyConsent({ bookingId }: { bookingId: string }) {
  const state = useLoad<{ consent: { allergies: string[] } | null }>(
    `/bookings/${bookingId}/allergy-consent`,
  );
  if (!state.data)
    return <LoadState error={state.error} retry={state.reload} />;
  return (
    <ActionForm
      after={state.reload}
      submit={(data) =>
        api(
          `/bookings/${bookingId}/allergy-consent`,
          json("PUT", { consent: data.get("share") === "on" }),
        )
      }
    >
      <label>
        <input
          key={String(!!state.data.consent)}
          type="checkbox"
          name="share"
          defaultChecked={!!state.data.consent}
        />{" "}
        Partager mes allergies avec l'h�te de ce repas une fois la r�servation
        accept�e
      </label>
    </ActionForm>
  );
}
function SharedAllergies({ bookingId }: { bookingId: string }) {
  const state = useLoad<{ allergies: string[] | null }>(
    `/bookings/${bookingId}/shared-allergies`,
  );
  if (!state.data)
    return <LoadState error={state.error} retry={state.reload} />;
  return (
    <p>
      {state.data.allergies
        ? `Allergies partag�es : ${state.data.allergies.join(", ") || "aucune renseign�e"}`
        : "Aucun partage d'allergies autoris�."}
    </p>
  );
}
function PublishMeal({ after }: { after: () => void }) {
  return (
    <details>
      <summary>Cr�er un repas</summary>
      <ActionForm
        after={after}
        success="Repas publi�."
        submit={(data) =>
          api(
            "/me/contexts",
            json("POST", {
              title: String(data.get("title")),
              kind: String(data.get("kind")),
              ambience: String(data.get("ambience")),
              safeFor: tags(data.get("safeFor")),
              supportedDiets: tags(data.get("supportedDiets")),
              languages: tags(data.get("languages")),
              themes: tags(data.get("themes")),
              contributionCents: Math.round(
                Number(data.get("contribution")) * 100,
              ),
              slots: [
                {
                  startsAt: new Date(
                    String(data.get("startsAt")),
                  ).toISOString(),
                  capacity: Number(data.get("capacity")),
                },
              ],
            }),
          )
        }
      >
        <Field name="title" label="Titre du repas" required maxLength={120} />
        <Field name="kind" label="Type de repas" required />
        <Field name="ambience" label="Ambiance" required />
        <Field
          name="languages"
          label="Langues (virgules)"
          maxLength={1944}
          required
        />
        <Field name="themes" label="Th�mes (virgules)" maxLength={1944} />
        <Field
          name="supportedDiets"
          label="R�gimes propos�s (virgules)"
          maxLength={1944}
        />
        <Field
          name="safeFor"
          label="Allerg�nes et intol�rances que vous pouvez exclure (virgules)"
          maxLength={1944}
        />
        <label>
          Date et heure locale
          <input name="startsAt" type="datetime-local" required />
        </label>
        <label>
          Places
          <input
            name="capacity"
            type="number"
            min={1}
            max={100}
            defaultValue={4}
            required
          />
        </label>
        <label>
          Participation par personne (?)
          <input
            name="contribution"
            type="number"
            min={0}
            max={1000}
            step="0.01"
            defaultValue={0}
            required
          />
        </label>
      </ActionForm>
    </details>
  );
}

export function ConnectedLogin() {
  const { user, error, retry, loading } = useSession();
  return (
    <div className="app pm-inner-page">
      <HomeHeader />
      <main className="pm-login">
        <header>
          <h1>Hello !</h1>
          <p>Connectez-vous pour retrouver vos h�tes pr�f�r�s</p>
        </header>
        <section className="pm-form-card" aria-label="Connexion">
          {loading ? (
            <p role="status">Chargement.</p>
          ) : user ? (
            <a className="pm-button" href="#/mon-profil/invite">
              Ouvrir mon profil
            </a>
          ) : (
            <>
              {error && (
                <div>
                  <p role="alert">{error}</p>
                  <button className="pm-button" type="button" onClick={retry}>
                    R�essayer
                  </button>
                </div>
              )}
              <div className="pm-login__actions">
                <a className="pm-button" href="/auth/login">
                  Se connecter
                </a>
              </div>
              <p className="pm-login__register">
                Pas encore de compte ? <a href="/auth/register">S'inscrire</a>
              </p>
              <p>
                La connexion et la r�initialisation du mot de passe se font sur
                la page s�curis�e Auth0.
              </p>
            </>
          )}
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}

