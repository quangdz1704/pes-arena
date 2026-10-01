import { describe, expect, it } from "vitest";
import { buildTournamentTeamPlan, numberFixtures, randomizeFixtureTeams } from "./tournament-team-plan";

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
    const teams = Array.from({ length: 12 }, (_, index) => ({ id: String(index) }));
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
    const assignments = randomizeFixtureTeams(buildTournamentTeamPlan("LEAGUE", 4, true), [{ id: "a" }, { id: "b" }]);
    expect(assignments).toHaveLength(12);
    expect(assignments.every((fixture) => fixture.homeTeamId !== fixture.awayTeamId)).toBe(true);
  });
});
