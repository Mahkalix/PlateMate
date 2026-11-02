export function TrustBar() {
  return (
    <div className="pm-trust">
      <span>
        <img src="/home/VerifiedIcon.svg" alt="" /> Hôtes vérifiés
        <small>Profils contrôlés</small>
      </span>
      <span>
        <img src="/home/SecurityIcon.svg" alt="" /> Paiement sécurisé
        <small>Stripe &amp; 3D Secure</small>
      </span>
      <span>
        <img src="/home/ReviewsIcon.svg" alt="" /> Avis authentiques
        <small>Vérifiés post-repas</small>
      </span>
    </div>
  );
}
