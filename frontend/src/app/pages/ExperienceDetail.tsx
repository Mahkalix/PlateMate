import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { getExperience, type ExperienceDetail as Detail } from "../lib/api";

export function ExperienceDetail() {
  const { id = "" } = useParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [guests, setGuests] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    getExperience(id, controller.signal)
      .then(setDetail)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [id]);
  if (error)
    return (
      <main className="pm-container pm-detail">
        <h1>Expérience introuvable</h1>
        <Button to="/explorer">Explorer les expériences</Button>
      </main>
    );
  if (!detail)
    return (
      <main className="pm-container pm-detail">
        <p>Chargement de l’expérience…</p>
      </main>
    );
  const { experience, dates, menu } = detail;
  const total = (
    ((experience.menuPriceCents + experience.serviceFeeCents) * guests) /
    100
  ).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  return (
    <main className="pm-container pm-detail">
      <nav className="pm-breadcrumb" aria-label="Fil d’Ariane">
        <Link to="/">Accueil</Link> / <Link to="/explorer">Explorer</Link> /{" "}
        {experience.hostName}
      </nav>
      <div className="pm-detail__layout">
        <div>
          <div className="pm-detail__hero">
            {experience.photoUrl && (
              <img src={experience.photoUrl} alt={experience.title} />
            )}
            <div>
              <h1>{experience.hostName}</h1>
              <p>Hôte PlateMate · {experience.city}</p>
            </div>
          </div>
          <section className="pm-detail__section">
            <h2>Le menu</h2>
            <p>
              Menu unique · {(experience.menuPriceCents / 100).toFixed(0)} € par
              personne
            </p>
            {menu.map((item) => (
              <article className="pm-menu-item" key={item.id}>
                <span aria-hidden="true">✽</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </section>
          <section className="pm-detail__section">
            <h2>À savoir avant de venir</h2>
            <div className="pm-detail__facts">
              <div>
                <strong>Conditions d’accès</strong>
                <p>
                  Les informations de l’hôte sont communiquées après
                  confirmation.
                </p>
              </div>
              <div>
                <strong>Ce qui est inclus</strong>
                <p>Le menu indiqué pour cette expérience.</p>
              </div>
              <div>
                <strong>Régimes alimentaires</strong>
                <p>{experience.cuisine}</p>
              </div>
              <div>
                <strong>Annulation</strong>
                <p>Consultez les conditions avant de réserver.</p>
              </div>
            </div>
          </section>
          <section className="pm-detail__section">
            <h2>Fiche hôte</h2>
            <div className="pm-host-profile">
              {experience.hostPhotoUrl && (
                <img
                  src={experience.hostPhotoUrl}
                  alt={`Portrait de ${experience.hostName}`}
                />
              )}
              <div>
                <h3>{experience.hostName}</h3>
                <p>{experience.hostBio || "Hôte PlateMate"}</p>
                <p>{experience.hostLanguages?.join(", ")}</p>
                <Button to="/connexion" variant="yellow">
                  Contacter →
                </Button>
              </div>
            </div>
          </section>
        </div>
        <aside className="pm-booking">
          <h2>PlateMate</h2>
          <p>{experience.title}</p>
          <p>
            {experience.city} · Chez {experience.hostName}
          </p>
          <fieldset>
            <legend>Choisir une date</legend>
            {dates.length ? (
              dates.map((date) => (
                <label key={date.id}>
                  <input
                    type="radio"
                    name="date"
                    value={date.id}
                    checked={selectedDate === date.id}
                    onChange={() => setSelectedDate(date.id)}
                    disabled={date.placesRemaining < 1}
                  />
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "full",
                    timeStyle: "short",
                  }).format(new Date(date.startsAt))}{" "}
                  · {date.placesRemaining} place(s)
                </label>
              ))
            ) : (
              <p>Aucune date disponible.</p>
            )}
          </fieldset>
          <label className="pm-booking__guests">
            Invités{" "}
            <input
              type="number"
              min="1"
              max="10"
              value={guests}
              onChange={(event) =>
                setGuests(
                  Math.max(1, Math.min(10, Number(event.target.value) || 1)),
                )
              }
            />
          </label>
          <div className="pm-booking__total">
            Total <strong>{total}</strong>
          </div>
          <Button
            to="/connexion"
            variant="yellow"
            className="pm-booking__submit"
          >
            Se connecter pour réserver
          </Button>
          <small>Aucun prélèvement avant confirmation de l’hôte.</small>
        </aside>
      </div>
    </main>
  );
}
