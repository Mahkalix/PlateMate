type TableCardProps = {
  host: string;
  title: string;
  photo: string;
  portrait: string;
  onSelect: () => void;
};

export function TableCard({
  host,
  title,
  photo,
  portrait,
  onSelect,
}: TableCardProps) {
  return (
    <button
      type="button"
      className="pm-table-card"
      aria-label={title + " avec " + host}
      onClick={onSelect}
    >
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
          <img src="/home/ArrowLeft.svg" alt="" />
        </span>
      </span>
      <span className="pm-table-card__portrait">
        <img src={"/home/" + portrait + ".webp"} alt="" />
        {host}
      </span>
    </button>
  );
}
