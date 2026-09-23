export type FixturePair<T> = { round: number; home: T; away: T };

export function generateRoundRobin<T>(competitors: T[]): FixturePair<T>[] {
  if (competitors.length < 2) throw new Error("Cần ít nhất 2 đối thủ để tạo lịch.");

  const slots: Array<T | null> = competitors.length % 2 === 0 ? [...competitors] : [...competitors, null];
  const fixtures: FixturePair<T>[] = [];
  const rounds = slots.length - 1;
  const gamesPerRound = slots.length / 2;

  for (let round = 0; round < rounds; round += 1) {
    for (let game = 0; game < gamesPerRound; game += 1) {
      const first = slots[game];
      const second = slots[slots.length - 1 - game];
      if (first !== null && second !== null) {
        fixtures.push({ round: round + 1, home: round % 2 === 0 ? first : second, away: round % 2 === 0 ? second : first });
      }
    }
    const fixed = slots[0]!;
    const rotating = slots.slice(1);
    rotating.unshift(rotating.pop()!);
    slots.splice(0, slots.length, fixed, ...rotating);
  }

  return fixtures;
}
