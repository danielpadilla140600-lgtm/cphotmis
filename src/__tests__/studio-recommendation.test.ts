import { describe, expect, it } from "vitest";
import { rankStudiosForRecommendation } from "../utils/studioRecommendation.ts";

describe("studio recommendations", () => {
  it("balances studio rating and starting-price affordability", () => {
    const ranked = rankStudiosForRecommendation([
      { id: "premium", name: "Premium", rating: 5, reviewCount: 20, startingPrice: 5000 },
      { id: "budget", name: "Budget", rating: 4, reviewCount: 8, startingPrice: 1000 }
    ]);

    expect(ranked[0].studio.id).toBe("budget");
    expect(ranked[0].score).toBeCloseTo(4.3);
    expect(ranked[1].score).toBeCloseTo(3.5);
  });

  it("uses review count and price to break equal-score ties", () => {
    const ranked = rankStudiosForRecommendation([
      { id: "fewer", name: "Fewer reviews", rating: 4, reviewCount: 3, startingPrice: 1000 },
      { id: "more", name: "More reviews", rating: 4, reviewCount: 12, startingPrice: 1000 }
    ]);

    expect(ranked.map(entry => entry.studio.id)).toEqual(["more", "fewer"]);
  });

  it("returns an empty list when there are no studios", () => {
    expect(rankStudiosForRecommendation([])).toEqual([]);
  });
});
