const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const MIN_REQUEST_INTERVAL_MS = 1100;

export interface StudioGeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
}

let nextRequestAt = 0;

function waitForRateLimit(signal?: AbortSignal): Promise<void> {
  const now = Date.now();
  const scheduledAt = Math.max(now, nextRequestAt);
  nextRequestAt = scheduledAt + MIN_REQUEST_INTERVAL_MS;
  const waitMs = scheduledAt - now;
  if (waitMs === 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Address lookup cancelled.", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    }, waitMs);
    const cancel = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      reject(new DOMException("Address lookup cancelled.", "AbortError"));
    };

    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel();
  });
}

async function fetchGeocodingResult(
  url: string,
  signal?: AbortSignal
): Promise<StudioGeocodingResult> {
  await waitForRateLimit(signal);
  if (signal?.aborted) {
    throw new DOMException("Address lookup cancelled.", "AbortError");
  }
  const response = await fetch(url, {
    headers: { "Accept-Language": "en, fil;q=0.9" },
    signal
  });
  if (!response.ok) {
    throw new Error("Address lookup is unavailable right now. Please try again.");
  }

  const result = await response.json() as {
    lat?: unknown;
    lon?: unknown;
    display_name?: unknown;
  } | Array<{ lat?: unknown; lon?: unknown; display_name?: unknown }>;
  const firstResult = Array.isArray(result) ? result[0] : result;
  const latitude = Number(firstResult?.lat);
  const longitude = Number(firstResult?.lon);
  const address = firstResult?.display_name;

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof address !== "string" ||
    !address.trim()
  ) {
    throw new Error("No matching address found. Try adding the barangay, Cainta, or Rizal.");
  }

  return { latitude, longitude, address };
}

export function geocodeStudioAddress(
  query: string,
  signal?: AbortSignal
): Promise<StudioGeocodingResult> {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: "1",
    countrycodes: "ph",
    "accept-language": "en,fil",
    q: `${query.trim()}, Cainta, Rizal, Philippines`
  });

  return fetchGeocodingResult(`${NOMINATIM_URL}/search?${params.toString()}`, signal);
}

export function reverseGeocodeStudioAddress(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<StudioGeocodingResult> {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    zoom: "18",
    "accept-language": "en,fil",
    lat: String(latitude),
    lon: String(longitude)
  });

  return fetchGeocodingResult(`${NOMINATIM_URL}/reverse?${params.toString()}`, signal);
}
