import { getKnockoutBracketSeedOrder } from "./knockout";
import { pickFreshPureTeams, type RandomSource } from "./match-randomization";
import { generateHomeAndAwayRoundRobin, generateRoundRobin } from "./round-robin";

export type FixtureTeamAssignment = {
  round: number;
  position: number;
  homeTeamId: string;
  awayTeamId: string;
};

export function numberFixtures<T extends { round: number }>(fixtures: T[]) {
  const positions = new Map<number, number>();
  return fixtures.map((fixture) => {
    const position = (positions.get(fixture.round) ?? 0) + 1;
    positions.set(fixture.round, position);
    return { ...fixture, position };
  });
}

// Knockout reserves every bracket slot, including rounds whose winners are not known yet.
export function buildTournamentTeamPlan(type: "LEAGUE" | "KNOCKOUT", count: number, homeAndAway: boolean) {
  if (count < 2 || count > 8) return [];
  const competitors = Array.from({ length: count }, (_, index) => index);
  if (type === "LEAGUE") {
    return numberFixtures(homeAndAway ? generateHomeAndAwayRoundRobin(competitors) : generateRoundRobin(competitors));
  }
  if (!Number.isInteger(Math.log2(count))) return [];
  const seeds = getKnockoutBracketSeedOrder(count);
  const plan: { round: number; position: number; home: number | null; away: number | null }[] = [];
  for (let round = 1, games = count / 2; games >= 1; round++, games /= 2) {
    for (let index = 0; index < games; index++) {
      plan.push({ round, position: index + 1, home: round === 1 ? seeds[index * 2]! - 1 : null, away: round === 1 ? seeds[index * 2 + 1]! - 1 : null });
    }
  }
  return plan;
}

export function randomizeFixtureTeams(
  plan: { round: number; position: number }[],
  teams: { id: string }[],
  random: RandomSource = Math.random,
): FixtureTeamAssignment[] {
  let recentTeamIds: string[] = [];
  return plan.map(({ round, position }) => {
    const [home, away] = pickFreshPureTeams(teams, recentTeamIds, random);
    recentTeamIds = [home.id, away.id, ...recentTeamIds].slice(0, 8);
    return { round, position, homeTeamId: home.id, awayTeamId: away.id };
  });
}
