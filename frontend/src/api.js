const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}

function assertApiConfigured() {
  if (!API_BASE_URL) {
    throw new Error("Set VITE_API_BASE_URL to your deployed SnapLink API Gateway URL.");
  }
}

async function request(path, options = {}) {
  assertApiConfigured();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}.`);
  }
  return payload;
}

/** Create a short URL for an absolute HTTP(S) URL. */
export function shortenUrl(url) {
  return request("/shorten", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

/** Fetch chart-ready analytics for one shortcode. */
export function getAnalytics(shortcode) {
  return request(`/analytics/${encodeURIComponent(shortcode)}`);
}
