import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isTeam =
    location.pathname.endsWith("equipe.html") ||
    location.pathname === "/equipe";
  return (
    <div className="page">
      <header className="header">
        <Link className="logo" to="/" aria-label="PlateMate, accueil">
          <img
            src="/whatsapp/assets/platemate-logo.png"
            alt="PlateMate"
            width="230"
            height="191"
          />
        </Link>
        <div className="header-links">
          <nav aria-label="Navigation principale">
            <Link to="/equipe" aria-current={isTeam ? "page" : undefined}>
              L’équipe
            </Link>
          </nav>
          <span className="city">Grenoble & alentours</span>
        </div>
      </header>
      {children}
      <footer>
        <span>© PlateMate 2026</span>
        <Link to="/mentions-legales">Mentions légales</Link>
        <a
          className="instagram-link"
          href="https://www.instagram.com/weareplatemate/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="PlateMate sur Instagram : @weareplatemate (nouvel onglet)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle
              cx="17.5"
              cy="6.5"
              r="1"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </a>
      </footer>
    </div>
  );
}
