import type { Experience } from "../lib/api";
import { CardAction } from "./CardAction";
import { InterestTag } from "./InterestTag";

export function HostCard({ experience }: { experience: Experience }) {
  const interests = experience.hostInterests?.slice(0, 3) ?? [];

  return (
    <article
      className="pm-host-card"
      aria-label={experience.title + ", avec " + experience.hostName}
    >
      <div className="pm-host-card__photo">
        {experience.photoUrl ? (
          <img src={experience.photoUrl} alt="" loading="lazy" />
        ) : (
          <span className="pm-host-card__empty" aria-hidden="true">
            {experience.cuisine}
          </span>
        )}
      </div>
      {experience.hostPhotoUrl && (
        <div className="pm-host-card__portrait-frame">
          <img
            src={experience.hostPhotoUrl}
            alt={"Portrait de " + experience.hostName}
            loading="lazy"
          />
        </div>
      )}
      <div className="pm-host-card__identity">
        <p className="pm-host-card__host">{experience.hostName}</p>
        <h3>{experience.title}</h3>
      </div>
      <div className="pm-host-card__interests">
        <p>Mes intérêts :</p>
        {interests.length > 0 && (
          <ul
            className="pm-host-card__tags"
            aria-label="Centres d’intérêt de l’hôte"
          >
            {interests.map((interest) => (
              <li key={interest}>
                <InterestTag>{interest}</InterestTag>
              </li>
            ))}
          </ul>
        )}
      </div>
      <CardAction to={"/experiences/" + experience.id}>
        Voir l’expérience
      </CardAction>
    </article>
  );
}
