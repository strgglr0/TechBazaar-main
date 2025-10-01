const rawBase = import.meta.env.VITE_API_BASE_URL ?? "/api";

const apiBaseUrl = rawBase.replace(/\/$/, "");

const toPath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export function apiUrl(path: string) {
  return `${apiBaseUrl}${toPath(path)}`;
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), init);
}
