import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Home } from "./Home";
import "../../../scss/app.scss";
const nav = [
  ["Accueil", "#accueil"],
  ["Explorer", "#tables"],
  ["Devenir hôte", "#hotes"],
  ["À propos", "/equipe"],
];
export function HomePage() {
  const [open, setOpen] = useState(false);
  const login = useRef<HTMLDialogElement>(null);
  const links = nav.map(([name, to]) => (
    <a key={name} href={to} onClick={() => setOpen(false)}>
      {name}
    </a>
  ));
  return (
    <div id="accueil" className="app">
      <header className="pm-header">
        <a href="#accueil" className="pm-logo" aria-label="PlateMate, accueil">
          <img src="/home/ColourWhite.webp" alt="PlateMate" />
        </a>
        <button
          className="pm-menu-toggle"
          aria-controls="home-nav"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Fermer" : "Menu"}
        </button>
        <nav
          id="home-nav"
          aria-label="Navigation principale"
          className={"pm-nav" + (open ? " is-open" : "")}
        >
          {links}
        </nav>
        <button
          className="pm-button pm-header__login"
          onClick={() => login.current?.showModal()}
        >
          <img src="/home/UserCircle.svg" alt="" />
          Se connecter
        </button>
      </header>
      <Home />
      <footer className="pm-footer">
        <div className="pm-footer__top">
          <a className="pm-logo" href="#accueil">
            <img src="/home/ColourWhite.webp" alt="PlateMate, accueil" />
          </a>
          <div className="pm-footer__social">
            <img src="/home/Tiktok.svg" alt="TikTok" />
            <a
              href="https://www.instagram.com/weareplatemate/"
              aria-label="Instagram PlateMate"
            >
              <img src="/home/Instagram.svg" alt="" />
            </a>
          </div>
          <nav aria-label="Pied de page">{links}</nav>
        </div>
        <div className="pm-footer__bottom">
          <span>© 2026 PlateMate. Tous droits réservés.</span>
          <Link to="/mentions-legales">Mentions légales</Link>
        </div>
      </footer>
      <dialog ref={login} className="pm-dialog">
        <h2>Se connecter</h2>
        <p>La connexion sera disponible lors du raccordement au backend.</p>
        <form method="dialog">
          <button autoFocus className="pm-button pm-button--red">
            Fermer
          </button>
        </form>
      </dialog>
    </div>
  );
}
