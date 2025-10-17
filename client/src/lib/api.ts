const rawBase = import.meta.env.VITE_API_BASE_URL ?? "/api";

const apiBaseUrl = rawBase.replace(/\/$/, "");

const toPath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export function apiUrl(path: string) {
  return `${apiBaseUrl}${toPath(path)}`;
}

export type ApiResult = { res: Response; data: any };

export async function apiFetch(path: string, init?: RequestInit): Promise<ApiResult> {
  const res = await fetch(apiUrl(path), init);

  // Try to parse JSON if the response has a JSON content-type.
  // If the body is empty or invalid JSON, fall back to null or text.
  let data: any = null;
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      // handle empty body safely
      const text = await res.text();
      data = text ? JSON.parse(text) : null;
    } else {
      // not JSON — try to return text if present
      const text = await res.text();
      data = text || null;
    }
  } catch (err) {
    // Parsing failed — keep data as null and allow callers to handle it
    data = null;
  }

  return { res, data };
}
