// Thin fetch wrapper for the passOP API. The access token lives in memory only;
// the refresh token is an HttpOnly cookie managed by the browser.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

let accessToken = null;
let onSessionExpired = () => {};
let refreshInFlight = null;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const setAccessToken = (token) => {
  accessToken = token;
};

// Called when a 401 could not be recovered by refreshing.
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

const errorMessage = async (res) => {
  if (res.status === 429) return "Too many attempts. Please wait a minute and try again.";
  try {
    const { detail } = await res.json();
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return "Some of the submitted values are invalid.";
  } catch {
    // fall through
  }
  return `Request failed (${res.status})`;
};

const send = (path, { method = "GET", body, auth = true } = {}) => {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};

// Refresh tokens rotate and replaying one revokes the whole session, so
// concurrent callers (e.g. React StrictMode, parallel 401s) must share one request.
export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await send("/auth/refresh", { method: "POST", auth: false });
        if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
        const data = await res.json();
        accessToken = data.access_token;
        return data;
      } catch (err) {
        accessToken = null;
        throw err;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function request(path, options = {}) {
  let res;
  try {
    res = await send(path, options);
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }
  if (res.status === 401 && options.auth !== false) {
    try {
      await refreshSession();
      res = await send(path, options);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        throw new ApiError(401, "Your session has expired. Please log in again.");
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
    }
  }
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res.status === 204 ? null : res.json();
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body, auth: false }),
  kdfParams: (email) =>
    request(`/auth/kdf-params?email=${encodeURIComponent(email)}`, { auth: false }),
  login: async (email, authKey) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: { email, auth_key: authKey },
      auth: false,
    });
    accessToken = data.access_token;
    return data;
  },
  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST", auth: false });
    } finally {
      accessToken = null;
    }
  },
  me: () => request("/auth/me"),
  vault: {
    list: () => request("/vault"),
    create: (item) => request("/vault", { method: "POST", body: item }),
    update: (id, item) => request(`/vault/${id}`, { method: "PUT", body: item }),
    remove: (id) => request(`/vault/${id}`, { method: "DELETE" }),
  },
};
