const nav = [
  ["Accueil", "#accueil"],
  ["Explorer", "#tables"],
  ["Devenir hôte", "#hotes"],
  ["À propos", "/equipe"],
];

export function HomeNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return nav.map(([name, to]) => (
    <a key={name} href={to} aria-current={to === "#accueil" ? "page" : undefined} onClick={onNavigate}>
      {name}
    </a>
  ));
}
