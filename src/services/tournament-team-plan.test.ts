import { describe, expect, it } from "vitest";
import { buildTournamentTeamPlan, getSameTierTeamGroups, numberFixtures, pickSameTierTeams, randomizeFixtureTeams } from "./tournament-team-plan";

describe("tournament team plans", () => {
  it.each([2, 3, 4, 5, 6, 7, 8])("reserves both legs for %i league competitors with unique round slots", (count) => {
    const plan = buildTournamentTeamPlan("LEAGUE", count, true);
    expect(plan).toHaveLength(count * (count - 1));
    expect(new Set(plan.map((fixture) => `${fixture.round}:${fixture.position}`)).size).toBe(plan.length);
    for (let home = 0; home < count; home++) {
      for (let away = 0; away < count; away++) {
        if (home !== away) expect(plan.filter((fixture) => fixture.home === home && fixture.away === away)).toHaveLength(1);
      }
    }
  });

  it("reserves all knockout slots and uses bracket seeds only for round one", () => {
    const plan = buildTournamentTeamPlan("KNOCKOUT", 8, false);
    expect(plan).toHaveLength(7);
    expect(plan.filter((fixture) => fixture.round === 1).map((fixture) => [fixture.home, fixture.away])).toEqual([[0, 7], [3, 4], [1, 6], [2, 5]]);
    expect(plan.at(-1)).toEqual({ round: 3, position: 1, home: null, away: null });
    expect(buildTournamentTeamPlan("KNOCKOUT", 3, false)).toEqual([]);
  });

  it("numbers matches separately within each round", () => {
    expect(numberFixtures([{ round: 1 }, { round: 1 }, { round: 2 }])).toEqual([{ round: 1, position: 1 }, { round: 1, position: 2 }, { round: 2, position: 1 }]);
  });

  it("randomizes every match without duplicate sides and avoids recent teams when possible", () => {
    const teams = Array.from({ length: 12 }, (_, index) => ({ id: String(index), tier: "S" as const }));
    const plan = buildTournamentTeamPlan("LEAGUE", 4, true);
    const assignments = randomizeFixtureTeams(plan, teams, () => 0.5);
    expect(assignments).toHaveLength(12);
    assignments.forEach((assignment, index) => {
      expect(assignment.homeTeamId).not.toBe(assignment.awayTeamId);
      expect(assignment.round).toBe(plan[index]!.round);
      expect(assignment.position).toBe(plan[index]!.position);
      if (index > 0) {
        const previous = assignments[index - 1]!;
        expect([previous.homeTeamId, previous.awayTeamId]).not.toContain(assignment.homeTeamId);
        expect([previous.homeTeamId, previous.awayTeamId]).not.toContain(assignment.awayTeamId);
      }
    });
  });

  it("supports a two-team pool across many matches", () => {
    const assignments = randomizeFixtureTeams(buildTournamentTeamPlan("LEAGUE", 4, true), [{ id: "a", tier: "S" }, { id: "b", tier: "S" }]);
    expect(assignments).toHaveLength(12);
    expect(assignments.every((fixture) => fixture.homeTeamId !== fixture.awayTeamId)).toBe(true);
  });

  const mixedTeams = [
    { id: "s", tier: "S" as const },
    ...Array.from({ length: 2 }, (_, index) => ({ id: `a${index}`, tier: "A" as const })),
    ...Array.from({ length: 4 }, (_, index) => ({ id: `b${index}`, tier: "B" as const })),
    ...Array.from({ length: 5 }, (_, index) => ({ id: `c${index}`, tier: "C" as const })),
  ];

  it.each([0, 0.3, 0.7, 0.999])("always picks unique fixed teams in one tier (random=%s)", (randomValue) => {
    const teams = pickSameTierTeams(mixedTeams, 4, () => randomValue);
    expect(teams).toHaveLength(4);
    expect(new Set(teams.map((team) => team.id)).size).toBe(4);
    expect(new Set(teams.map((team) => team.tier)).size).toBe(1);
    expect(["B", "C"]).toContain(teams[0]!.tier);
  });

  it.each([0, 0.3, 0.7, 0.999])("never mixes tiers across individual fixtures or cooldown fallback (random=%s)", (randomValue) => {
    const teamsById = new Map(mixedTeams.map((team) => [team.id, team]));
    const assignments = randomizeFixtureTeams(buildTournamentTeamPlan("LEAGUE", 8, true), mixedTeams, () => randomValue);
    expect(assignments).toHaveLength(56);
    assignments.forEach((fixture) => {
      expect(fixture.homeTeamId).not.toBe(fixture.awayTeamId);
      expect(teamsById.get(fixture.homeTeamId)?.tier).toBe(teamsById.get(fixture.awayTeamId)?.tier);
      expect(fixture.homeTeamId).not.toBe("s");
      expect(fixture.awayTeamId).not.toBe("s");
    });
  });

  it("falls back to a valid same-tier pair rather than mixing unused singleton tiers", () => {
    const teams = [{ id: "a", tier: "A" as const }, { id: "b", tier: "B" as const }, { id: "c", tier: "C" as const }, { id: "c2", tier: "C" as const }];
    const assignments = randomizeFixtureTeams(buildTournamentTeamPlan("LEAGUE", 4, true), teams);
    expect(assignments.every((fixture) => [fixture.homeTeamId, fixture.awayTeamId].sort().join(",") === "c,c2")).toBe(true);
  });

  it("rejects insufficient same-tier choices instead of silently mixing tiers", () => {
    expect(getSameTierTeamGroups(mixedTeams, 6)).toEqual([]);
    expect(() => pickSameTierTeams(mixedTeams, 6)).toThrow("không có tier nào đủ 6 đội");
    expect(() => randomizeFixtureTeams([{ round: 1, position: 1 }], [{ id: "a", tier: "A" }, { id: "b", tier: "B" }])).toThrow("không có tier nào đủ 2 đội");
    expect(getSameTierTeamGroups(mixedTeams, 0)).toEqual([]);
    expect(() => pickSameTierTeams([], 2)).toThrow();
  });
});
