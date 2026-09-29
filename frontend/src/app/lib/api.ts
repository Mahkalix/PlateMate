export type Experience = {
  id: string;
  title: string;
  city: string;
  cuisine: string;
  theme: string | null;
  atmosphere: string | null;
  photoUrl: string | null;
  hostPhotoUrl: string | null;
  hostName: string;
  hostBio?: string | null;
  hostLanguages?: string[];
  hostInterests: string[];
  totalPerGuestCents?: number;
  menuPriceCents: number;
  serviceFeeCents: number;
  nextDate?: string;
};
export type ExperienceDetail = {
  experience: Experience & {
    description?: string | null;
    hostId: string;
    hostBio: string | null;
    hostLanguages: string[];
  };
  dates: { id: string; startsAt: string; placesRemaining: number }[];
  menu: { id: string; title: string; description: string; position: number }[];
};
export type Search = {
  city?: string;
  cuisine?: string;
  date?: string;
  guests?: number;
  limit?: number;
  offset?: number;
};
const base = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${base}/api${path}`, { signal });
  if (!response.ok) throw new Error(`API HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
export function getExperiences(filters: Search, signal?: AbortSignal) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return request<{
    experiences: Experience[];
    pagination: { hasMore: boolean };
  }>(`/experiences?${params}`, signal);
}
export function getExperience(id: string, signal?: AbortSignal) {
  return request<ExperienceDetail>(
    `/experiences/${encodeURIComponent(id)}`,
    signal,
  );
}
