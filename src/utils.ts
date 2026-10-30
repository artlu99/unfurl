// Query params that don't change the resource, only attribution.
const TRACKING_PARAMS = ["fbclid", "gclid", "igshid", "mc_cid", "mc_eid", "ref"];

// Collapse semantically-identical URLs onto one cache key so the same page
// (with/without tracking params, fragments, casing) is fetched once.
export const normalizeUrl = (urlString: string): string | null => {
  try {
    const u = new URL(urlString);
    u.hash = "";
    u.protocol = u.protocol.toLowerCase();
    u.hostname = u.hostname.toLowerCase();
    if (
      (u.protocol === "https:" && u.port === "443") ||
      (u.protocol === "http:" && u.port === "80")
    ) {
      u.port = "";
    }
    for (const key of [...u.searchParams.keys()]) {
      if (key.startsWith("utm_") || TRACKING_PARAMS.includes(key)) {
        u.searchParams.delete(key);
      }
    }
    return u.toString();
  } catch (e) {
    return null;
  }
};

export const isValidUrl = (urlString: string) => {
  return normalizeUrl(urlString) !== null;
};

// Workers Caching purge tag for a URL. Hex SHA-256 stays within the tag rules
// (printable ASCII, no spaces) and keeps URLs out of the tag namespace itself.
export const cacheTagFor = async (url: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(url),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const FETCH_TIMEOUT_MS = 10_000;

export const safeFetch = async (url: string): Promise<string | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return await res.text();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
};
