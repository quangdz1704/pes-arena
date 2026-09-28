export type ArenaRankTier = {
  id: "ROOKIE" | "WARRIOR" | "PRO" | "STAR" | "SUPERSTAR" | "LEGEND";
  label: string;
  minRating: number;
  tone: string;
};

export const arenaRankTiers: ArenaRankTier[] = [
  { id: "LEGEND", label: "Huyền thoại", minRating: 1500, tone: "text-amber-300" },
  { id: "SUPERSTAR", label: "Siêu sao", minRating: 1350, tone: "text-fuchsia-300" },
  { id: "STAR", label: "Ngôi sao", minRating: 1200, tone: "text-sky-300" },
  { id: "PRO", label: "Chuyên nghiệp", minRating: 1100, tone: "text-violet-300" },
  { id: "WARRIOR", label: "Chiến binh", minRating: 1000, tone: "text-primary" },
  { id: "ROOKIE", label: "Tân binh", minRating: 0, tone: "text-muted-foreground" },
];

export function getArenaRank(rating: number) {
  return arenaRankTiers.find((tier) => rating >= tier.minRating) ?? arenaRankTiers.at(-1)!;
}
