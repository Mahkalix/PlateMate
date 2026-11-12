const nav = [
  ["Accueil", "#accueil"],
  ["Explorer", "#tables"],
  ["Devenir hôte", "#/devenir-hote"],
  ["À propos", "#/a-propos"],
];

export function HomeNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return nav.map(([name, to]) => (
    <a
      key={name}
      href={to}
      aria-current={
        window.location.hash === to ||
        (to === "#accueil" && !window.location.hash.startsWith("#/"))
          ? "page"
          : undefined
      }
      onClick={onNavigate}
    >
      {name}
    </a>
  ));
}
