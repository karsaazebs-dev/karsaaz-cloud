// Base API client — adds auth headers to every request

const BACKEND_URL =
  process.env.KARSAAZ_BACKEND_URL || "http://localhost:3030";

export interface ApiOptions extends RequestInit {
  basicAuth?: string;
}

/** Build Authorization header from stored session basicAuth token */
export function buildAuthHeaders(basicAuth: string): HeadersInit {
  return {
    Authorization: `Basic ${basicAuth}`,
    "OCS-APIREQUEST": "true",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Generic fetch wrapper that forwards auth and targets the backend */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { basicAuth, headers, ...rest } = options;

  const authHeaders: Record<string, string> = basicAuth
    ? { Authorization: `Basic ${basicAuth}` }
    : {};

  // Normalize incoming headers to a plain object
  const extraHeaders: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((v, k) => { extraHeaders[k] = v; });
  } else if (Array.isArray(headers)) {
    for (const [k, v] of headers) extraHeaders[k] = v;
  } else if (headers) {
    Object.assign(extraHeaders, headers);
  }

  // In browser context route through Next.js proxy (same origin) to avoid CORS.
  const isServer = typeof window === "undefined";
  const apiUrl = isServer ? `${BACKEND_URL}${path}` : `/api/proxy${path}`;

  const response = await fetch(apiUrl, {
    ...rest,
    headers: {
      "OCS-APIREQUEST": "true",
      Accept: "application/json",
      ...authHeaders,
      ...extraHeaders,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, path);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as T;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly path: string
  ) {
    super(`API error ${status} ${statusText} on ${path}`);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isForbidden() {
    return this.status === 403;
  }
}

/** Validate credentials by calling /cloud/user with Basic auth */
export async function validateCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const basicAuth = btoa(`${username}:${password}`);
  const isServer = typeof window === "undefined";
  const url = isServer
    ? `${BACKEND_URL}/ocs/v2.php/cloud/user?format=json`
    : `/api/proxy/ocs/v2.php/cloud/user?format=json`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "OCS-APIREQUEST": "true",
      },
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
