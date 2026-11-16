import { useRef } from "react";
import { Button } from "./Button";

export function AccountHeading({
  name,
  host = false,
  active,
  populated = false,
}: {
  name: string;
  host?: boolean;
  active: "profile" | "meals";
  populated?: boolean;
}) {
  const notice = useRef<HTMLDialogElement>(null);
  return (
    <div className="pm-account__heading">
      <h1>Bonjour {name}</h1>
      <nav className="pm-account__tabs" aria-label="Mon compte">
        <a
          href={`#/mon-profil/${host ? "hote" : "invite"}`}
          aria-current={active === "profile" ? "page" : undefined}
        >
          Profil
        </a>
        <a
          href={`#/mes-repas/${host ? "hote" : "invite"}${populated ? "" : "/vide"}`}
          aria-current={active === "meals" ? "page" : undefined}
        >
          Mes repas
        </a>
        <button onClick={() => notice.current?.showModal()}>
          {host ? "Portefeuille" : "Paiements"}
        </button>
      </nav>
      <dialog ref={notice}>
        <p>Les paiements ne sont pas disponibles dans cette démonstration.</p>
        <Button onClick={() => notice.current?.close()}>Fermer</Button>
      </dialog>
    </div>
  );
}
