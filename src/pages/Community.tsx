export function Community() {
  return (
    <main>
      <div className="cover">
        <img
          src="/whatsapp/assets/hero-table.png"
          alt="Un repas à partager autour d’une grande table"
          width="1125"
          height="750"
          fetchPriority="high"
        />
      </div>
      <section className="intro" aria-labelledby="title">
        <p className="construction-note">Site en construction</p>
        <h1 id="title">
          Un repas,
          <br />
          une rencontre,
          <br />
          une culture.
        </h1>
        <p>
          On teste les repas entre hôtes et invités à Grenoble et aux alentours.
          Tu nous rejoins ?
        </p>
      </section>
      <div className="communities">
        <a
          className="group group-whatsapp"
          href="https://chat.whatsapp.com/FZZxZ4uXX8E5D3ac2s2Tc3"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Rejoindre le groupe WhatsApp PlateMate Grenoble et alentours (nouvel onglet)"
        >
          <img
            className="whatsapp-logo"
            src="/whatsapp/assets/whatsapp.svg"
            alt=""
            width="36"
            height="36"
          />
          <span className="group-copy">
            <strong>Rejoindre le groupe WhatsApp</strong>
          </span>
          <span className="arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
      <p className="community-values">
        Une communauté bienveillante où chacun peut se sentir en confiance, avec
        ses différences.
      </p>
    </main>
  );
}
