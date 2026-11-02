export interface StudioRecommendationCandidate {
  id: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  startingPrice?: number;
}

export interface RankedStudioRecommendation {
  studio: StudioRecommendationCandidate;
  score: number;
}

export function rankStudiosForRecommendation(
  studios: readonly StudioRecommendationCandidate[]
): RankedStudioRecommendation[] {
  if (studios.length === 0) return [];

  const prices = studios.map(studio => Math.max(0, studio.startingPrice ?? 0));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return studios
    .map((studio, index) => {
      const rating = Math.min(5, Math.max(0, studio.rating ?? 0));
      const affordability = maxPrice === minPrice
        ? 5
        : ((maxPrice - prices[index]) / (maxPrice - minPrice)) * 5;

      return {
        studio,
        score: (rating * 0.7) + (affordability * 0.3)
      };
    })
    .sort((a, b) =>
      b.score - a.score ||
      (b.studio.reviewCount ?? 0) - (a.studio.reviewCount ?? 0) ||
      (a.studio.startingPrice ?? 0) - (b.studio.startingPrice ?? 0) ||
      a.studio.name.localeCompare(b.studio.name)
    );
}
