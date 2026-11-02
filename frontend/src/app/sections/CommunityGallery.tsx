export function CommunityGallery() {
  return (
    <section className="pm-gallery">
      <div className="pm-gallery__title">
        <div className="pm-container">
          <p className="pm-eyebrow">La communauté en images</p>
          <h2>Des repas, des cultures, des rencontres.</h2>
        </div>
      </div>
      <div className="pm-container">
        <div className="pm-gallery__photo">
          <img src="/home/1371.webp" alt="Plats partagés autour d’une table" />
          <img src="/home/Foto1.webp" alt="Amis réunis autour d’un repas" />
          <img src="/home/1381.webp" alt="Repas partagé autour d’une table" />
          <img
            src="/home/TiramisuNouvelleIdee1.webp"
            alt="Plat dressé à table"
          />
          <img src="/home/FotoFoto1.webp" alt="Convives partageant des plats" />
          <img src="/home/1401.webp" alt="Grande tablée conviviale" />
        </div>
        <a
          href="https://www.instagram.com/weareplatemate/"
          className="pm-gallery__share"
        >
          <img src="/home/InstagramIcon.svg" alt="" />
          <div>
            <strong>Partagez vos moments</strong>
            <p>
              Partagez vos plus beaux moments avec nous sur Instagram en nous
              identifiant @weareplatemate.
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}
