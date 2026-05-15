export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://15.207.86.248:3000/api/v1";
export const ADMIN_TOKEN_COOKIE = "admin_token";

export function getAuthHeaders(token?: string): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await safeError(response);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function safeError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error ?? data.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}
