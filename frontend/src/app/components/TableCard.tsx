type TableCardProps = {
  host: string;
  title: string;
  photo: string;
  portrait: string;
  variant?: "filled" | "outline";
} & (
  { href: string; onSelect?: never } | { href?: never; onSelect: () => void }
);

export function TableCard({
  host,
  title,
  photo,
  portrait,
  onSelect,
  href,
  variant = "filled",
}: TableCardProps) {
  const content = (
    <>
      <span className="pm-table-card__frame">
        <img
          className="pm-table-card__meal"
          src={"/home/" + photo + ".webp"}
          alt=""
          loading="lazy"
        />
        <span className="pm-table-card__paper" aria-hidden="true" />
        <strong className="pm-table-card__title">{title}</strong>
        <span className="pm-table-card__interests">
          Mes intérêts :
          <span className="pm-table-card__tags">
            {["Musique", "Jiu Jitsu", "Films"].map((interest) => (
              <span key={interest}>{interest}</span>
            ))}
          </span>
        </span>
        <span className="pm-table-card__arrow">
          <img
            src={
              variant === "outline" ? "/ready/54d67.svg" : "/home/ArrowLeft.svg"
            }
            alt=""
          />
        </span>
      </span>
      <span className="pm-table-card__portrait">
        <img src={"/home/" + portrait + ".webp"} alt="" />
        {host}
      </span>
    </>
  );
  const label = title + " avec " + host;
  return href ? (
    <a
      href={href}
      className={`pm-table-card pm-table-card--${variant}`}
      aria-label={label}
    >
      {content}
    </a>
  ) : (
    <button
      type="button"
      className={`pm-table-card pm-table-card--${variant}`}
      aria-label={label}
      onClick={onSelect}
    >
      {content}
    </button>
  );
}
