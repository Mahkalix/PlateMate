import { TableCard } from "./TableCard";
import { useRef, useState } from "react";
const cards = [
  ["Usain", "La French Touch", "BackgroundImage2", "Image26"],
  ["Troy", "USA Burgers", "BackgroundImage3", "Image27"],
  ["Amina", "Nuit libanaise", "BackgroundImage", "Image25"],
  ["Jean-Marc", "La French Touch", "BackgroundImage4", "Image28"],
  ["Usain", "La French Touch", "BackgroundImage2", "Image26"],
] as const;
export function Featured() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(2);
  return (
    <>
      <div
        className="pm-featured__cards"
        id="cartes"
        aria-label="Les tables à la une"
      >
        {cards.map(([host, title, photo, portrait], i) => (
          <TableCard
            key={i}
            host={host}
            title={title}
            photo={photo}
            portrait={portrait}
            onSelect={() => {
              setSelected(i);
              dialog.current?.showModal();
            }}
          />
        ))}
      </div>
      <dialog className="pm-dialog" ref={dialog}>
        <h2>{cards[selected][1]}</h2>
        <p>À table avec {cards[selected][0]}.</p>
        <p>Cette table est présentée dans la preview de l’accueil.</p>
        <form method="dialog">
          <button autoFocus className="pm-button pm-button--red">
            Fermer
          </button>
        </form>
      </dialog>
    </>
  );
}
