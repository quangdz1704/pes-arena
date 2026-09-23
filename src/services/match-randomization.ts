export type RandomSource = () => number;

export type RandomizableTeam = {
  id: string;
  tier: "S" | "A" | "B" | "C";
  rating: number;
};

function randomIndex(length: number, random: RandomSource) {
  return Math.floor(random() * length);
}

export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const nextIndex = randomIndex(index + 1, random);
    [result[index], result[nextIndex]] = [result[nextIndex]!, result[index]!];
  }

  return result;
}

export function pickUnique<T>(
  items: readonly T[],
  count: number,
  random: RandomSource = Math.random,
) {
  if (count > items.length) {
    throw new Error("Không đủ lựa chọn để random.");
  }

  return shuffle(items, random).slice(0, count);
}

export function shufflePairs(
  playerIds: readonly string[],
  currentSides?: readonly [readonly string[], readonly string[]],
  random: RandomSource = Math.random,
) {
  if (playerIds.length !== 4 || new Set(playerIds).size !== 4) {
    throw new Error("Cần đúng 4 người chơi khác nhau để ghép cặp.");
  }

  const [a, b, c, d] = playerIds;
  const pairings: [string[], string[]][] = [
    [[a!, b!], [c!, d!]],
    [[a!, c!], [b!, d!]],
    [[a!, d!], [b!, c!]],
  ];
  const normalizedCurrent = currentSides
    ? currentSides
        .map((side) => [...side].sort().join(","))
        .sort()
        .join("|")
    : undefined;
  const alternatives = pairings.filter((pairing) => {
    const normalized = pairing
      .map((side) => [...side].sort().join(","))
      .sort()
      .join("|");
    return normalized !== normalizedCurrent;
  });

  return alternatives[randomIndex(alternatives.length, random)]!;
}

export function pickPureTeams<T extends { id: string }>(
  teams: readonly T[],
  random: RandomSource = Math.random,
) {
  return pickUnique(teams, 2, random) as [T, T];
}

export function pickBalancedTeams<T extends RandomizableTeam>(
  teams: readonly T[],
  random: RandomSource = Math.random,
) {
  if (teams.length < 2) {
    throw new Error("Nhóm đội cần ít nhất 2 đội để random.");
  }

  const first = pickUnique(teams, 1, random)[0]!;
  const candidates = teams.filter((team) => team.id !== first.id);
  const sameTier = candidates.filter((team) => team.tier === first.tier);
  const shortlist = sameTier.length > 0 ? sameTier : candidates;
  const closestDifference = Math.min(
    ...shortlist.map((team) => Math.abs(team.rating - first.rating)),
  );
  const closest = shortlist.filter(
    (team) => Math.abs(team.rating - first.rating) === closestDifference,
  );

  return [first, pickUnique(closest, 1, random)[0]!] as [T, T];
}
