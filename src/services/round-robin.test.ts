import { describe, expect, it } from "vitest";
import { generateRoundRobin } from "./round-robin";

describe("round robin", () => {
  it("creates every pairing once for an even competitor count", () => {
    const fixtures = generateRoundRobin(["A", "B", "C", "D"]);
    expect(fixtures).toHaveLength(6);
    expect(new Set(fixtures.map((fixture) => [fixture.home, fixture.away].sort().join("-")))).toHaveLength(6);
  });
  it("gives one bye per round for an odd competitor count", () => {
    expect(generateRoundRobin(["A", "B", "C"])).toHaveLength(3);
  });
});
