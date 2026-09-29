import { Link } from "react-router-dom";
import type { Experience } from "../lib/api";

export function HostCard({ experience }: { experience: Experience }) {
  return (
    <article className="pm-host-card">
      <div className="pm-host-card__photo">
        {experience.photoUrl ? (
          <img
            src={experience.photoUrl}
            alt={experience.title}
            loading="lazy"
          />
        ) : (
          <span aria-hidden="true" className="pm-host-card__empty">
            {experience.cuisine}
          </span>
        )}
        {experience.hostPhotoUrl && (
          <img
            className="pm-host-card__portrait"
            src={experience.hostPhotoUrl}
            alt={`Portrait de ${experience.hostName}`}
            loading="lazy"
          />
        )}
      </div>
      <div className="pm-host-card__body">
        <p className="pm-host-card__level">Hôte PlateMate</p>
        <h3>{experience.hostName}</h3>
        <div className="pm-host-card__tags">
          <span>{experience.cuisine}</span>
          {experience.hostInterests?.slice(0, 2).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <p className="pm-host-card__meta">
          {experience.city}
          {experience.nextDate
            ? ` · ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(experience.nextDate))}`
            : ""}
        </p>
        <Link
          to={`/experiences/${experience.id}`}
          className="pm-host-card__link"
        >
          Voir l’expérience <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
