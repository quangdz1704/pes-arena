export type KnockoutFixture<T> = {
  round: number;
  home: T;
  away: T;
};

export function generateKnockoutRound<T>(competitors: T[], round = 1): KnockoutFixture<T>[] {
  if (competitors.length < 2 || competitors.length % 2 !== 0) {
    throw new Error("Số đối thủ của một vòng knockout phải là số chẵn và từ 2 trở lên.");
  }

  return Array.from({ length: competitors.length / 2 }, (_, index) => ({
    round,
    home: competitors[index * 2]!,
    away: competitors[index * 2 + 1]!,
  }));
}

export function getKnockoutRoundLabel(round: number, totalRounds: number) {
  const remainingRounds = totalRounds - round;
  if (remainingRounds === 0) return "Chung kết";
  if (remainingRounds === 1) return "Bán kết";
  if (remainingRounds === 2) return "Tứ kết";
  return `Vòng ${round}`;
}
