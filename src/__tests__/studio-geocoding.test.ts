import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeStudioAddress, reverseGeocodeStudioAddress } from "../utils/studioGeocoding.ts";

describe("studio registration address and map geocoding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("finds map coordinates for a Cainta studio address", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        lat: "14.5882",
        lon: "121.1278",
        display_name: "Ortigas Avenue, Cainta, Rizal, Philippines"
      }]
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(geocodeStudioAddress("Ortigas Avenue")).resolves.toEqual({
      latitude: 14.5882,
      longitude: 121.1278,
      address: "Ortigas Avenue, Cainta, Rizal, Philippines"
    });

    const requestUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestUrl.pathname).toBe("/search");
    expect(requestUrl.searchParams.get("q")).toBe("Ortigas Avenue, Cainta, Rizal, Philippines");
    expect(requestUrl.searchParams.get("countrycodes")).toBe("ph");
  });

  it("returns a suggested address for a selected pin location", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        lat: "14.5954",
        lon: "121.1085",
        display_name: "Brookside Hills, Cainta, Rizal, Philippines"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(reverseGeocodeStudioAddress(14.5954, 121.1085)).resolves.toMatchObject({
      latitude: 14.5954,
      longitude: 121.1085,
      address: "Brookside Hills, Cainta, Rizal, Philippines"
    });

    const requestUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestUrl.pathname).toBe("/reverse");
    expect(requestUrl.searchParams.get("lat")).toBe("14.5954");
    expect(requestUrl.searchParams.get("lon")).toBe("121.1085");
  });
});
