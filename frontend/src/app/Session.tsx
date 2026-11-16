import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, clearSession, errorMessage, refreshSession } from "./api";
import type { Profile } from "./profile";

type User = { id: string; email: string };
const Context = createContext<{
  user: User | null;
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  draftName: string;
  setDraftName: (name: string) => void;
  loading: boolean;
  error: string;
  retry: () => void;
  logout: () => Promise<void>;
}>(null!);
export const useSession = () => useContext(Context);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let active = true;
    const ended = () => {
      if (active) {
        setUser(null);
        setProfile(null);
        setDraftName("");
      }
    };
    window.addEventListener("session-ended", ended);
    setLoading(true);
    setError("");
    (async () => {
      try {
        const next = (await refreshSession()) ? await api<User>("/me") : null;
        const owner = next
          ? await api<{ profile: Profile | null }>("/me/profile")
          : null;
        if (active) {
          setUser(next);
          setProfile(owner?.profile ?? null);
        }
      } catch (e) {
        if (active) setError(errorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      window.removeEventListener("session-ended", ended);
    };
  }, [attempt]);
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    clearSession();
    window.location.hash = "#/connexion";
  }
  return (
    <Context.Provider
      value={{
        user,
        profile,
        setProfile,
        draftName,
        setDraftName,
        loading,
        error,
        retry: () => retry((n) => n + 1),
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function RequireSession({ children }: { children: ReactNode }) {
  const { user, loading, error, retry } = useSession();
  if (loading)
    return (
      <main className="pm-live">
        <p role="status">Chargement de votre session.</p>
      </main>
    );
  if (error)
    return (
      <main className="pm-live">
        <p role="alert">{error}</p>
        <button onClick={retry}>Réessayer</button>
      </main>
    );
  if (!user)
    return (
      <main className="pm-live">
        <h1>Connectez-vous pour continuer</h1>
        <a className="pm-button" href="/auth/login">
          Se connecter
        </a>
        <a href="/auth/register">Créer un compte</a>
      </main>
    );
  return children;
}
