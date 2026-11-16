export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let generation = 0;
export function clearSession() {
  generation++;
  accessToken = null;
  window.dispatchEvent(new Event("session-ended"));
}

export async function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  const current = generation;
  refreshing = (async () => {
    const response = await fetch("/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.status === 401) {
      clearSession();
      return false;
    }
    if (!response.ok)
      throw new ApiError(response.status, "session_unavailable");
    const data = await response.json();
    if (typeof data.accessToken !== "string")
      throw new ApiError(502, "invalid_response");
    if (generation !== current) return false;
    accessToken = data.accessToken;
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Invalid API path");
  if (!accessToken && !(await refreshSession()))
    throw new ApiError(401, "unauthorized");
  const request = () =>
    fetch(`/api${path}`, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  const usedToken = accessToken;
  let response = await request();
  if (response.status === 401) {
    if (accessToken === usedToken && !(await refreshSession()))
      throw new ApiError(401, "unauthorized");
    response = await request();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) clearSession();
    throw new ApiError(response.status, body.error || "request_failed");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "public_interests")
    return "Les centres d’intérêt publics doivent faire partie de vos affinités.";
  if (error instanceof Error && error.message === "consent_required")
    return "Votre accord est nécessaire pour conserver les préférences alimentaires. Sinon, videz ces champs.";
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      invalid_input: "Vérifiez les champs du formulaire.",
      host_required: "Créez votre profil hôte pour accéder à cette rubrique.",
      profile_required: "Complétez d’abord votre profil.",
      profile_required_or_already_host:
        "Un profil complet est nécessaire, ou vous êtes déjà hôte. Rechargez votre compte.",
      unauthorized: "Votre session a expiré. Reconnectez-vous.",
      not_found: "Cet élément n’est plus disponible.",
      insufficient_balance:
        "Le solde de votre portefeuille est insuffisant. Le paiement n’a pas été effectué.",
      payment_required:
        "Le paiement de ce repas doit être réglé avant de le terminer.",
      slot_full: "Ce créneau est complet. Choisissez une autre date.",
      already_booked:
        "Vous avez déjà une demande pour ce créneau. Consultez Mes repas.",
      profile_consent_required:
        "Autorisez d’abord le traitement de vos préférences alimentaires dans votre profil.",
      booking_no_longer_eligible:
        "Les préférences alimentaires de l’invité ne sont plus compatibles avec ce repas.",
      too_many_requests: "Trop de demandes. Réessayez dans une minute.",
    };
    return (
      messages[error.code] ||
      (error.status === 409
        ? "Cette action n’est plus possible. Actualisez les données et réessayez."
        : "Le serveur n’a pas pu traiter la demande. Réessayez.")
    );
  }
  return "Connexion au serveur impossible. Vérifiez que l’API est démarrée.";
}
