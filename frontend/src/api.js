const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }

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

