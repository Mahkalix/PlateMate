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
      className="pm-table-card"
      aria-label={title + " avec " + host}
      onClick={onSelect}
    >
      <img
        className="meal-photo"
        src={"/home/" + photo + ".webp"}
        alt=""
        loading="lazy"
      />
      <span className="polaroid">
        <img src={"/home/" + portrait + ".webp"} alt="" />
        {host}
      </span>
      <span className="card-info">
        <strong>{title}</strong>
        <small>Mes intérêts :</small>
        <span>Musique · Jiu Jitsu · Films</span>
        <img src="/home/ArrowLeft.svg" alt="" />
      </span>
    </button>
  );
}
