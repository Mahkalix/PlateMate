import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "./Button";

const nav = [
  { to: "/", label: "Accueil", end: true },
  { to: "/explorer", label: "Explorer" },
  { to: "/devenir-hote", label: "Devenir hôte" },
  { to: "/a-propos", label: "À propos" },
];
export function AppShell() {
  const [open, setOpen] = useState(false);
  const isHome = useLocation().pathname === "/";
  return (
    <div className="app">
      <header className="pm-header">
        <Link to="/" className="pm-logo" aria-label="PlateMate, accueil">
          <img
            src={isHome ? "/figma/logo-cream.png" : "/figma/logo-red.png"}
            alt=""
          />
        </Link>
        <button
          className="pm-menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="pm-main-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? "Fermer" : "Menu"}
        </button>
        <nav
          id="pm-main-nav"
          className={open ? "pm-nav is-open" : "pm-nav"}
          aria-label="Navigation principale"
        >
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "is-active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button to="/connexion" className="pm-header__login">
          ◎ &nbsp; Se connecter
        </Button>
      </header>
      <Outlet />
      <footer className="pm-footer">
        <div className="pm-footer__top">
          <Link
            to="/"
            className="pm-logo pm-logo--light"
            aria-label="PlateMate, accueil"
          >
            <img src="/figma/logo-cream.png" alt="" />
          </Link>
          <div className="pm-footer__social">
            <a
              href="https://www.instagram.com/weareplatemate/"
              aria-label="Instagram PlateMate"
            >
              ◎
            </a>
          </div>
          <nav aria-label="Explorer">
            <strong>Explorer</strong>
            <Link to="/explorer">Toutes les expériences</Link>
            <Link to="/explorer">Par ville</Link>
            <Link to="/explorer">Par cuisine</Link>
            <Link to="/explorer">Par thème</Link>
          </nav>
        </div>
        <div className="pm-footer__bottom">
          <span>© 2026 PlateMate. Tous droits réservés.</span>
          <Link to="/mentions-legales">Mentions légales</Link>
        </div>
      </footer>
    </div>
  );
}
