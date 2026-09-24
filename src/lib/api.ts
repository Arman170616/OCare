const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resolvedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${resolvedPath}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || response.statusText || 'Request failed';

    try {
      const json = JSON.parse(text);
      if (typeof json?.detail === 'string') {
        message = json.detail;
      } else if (Array.isArray(json?.detail)) {
        const first = json.detail[0];
        if (first && typeof first === 'object') {
          message = first.msg || first.message || 'Validation failed';
        }
      }
    } catch {
      // ignore malformed JSON error payloads;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiBaseUrl = API_BASE_URL;
