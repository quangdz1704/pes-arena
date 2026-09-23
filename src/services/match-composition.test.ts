import { describe, expect, it } from "vitest";

import { validateMatchComposition } from "./match-composition";

const playerIds = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
];

describe("validateMatchComposition", () => {
  it("accepts a valid 1v1 composition", () => {
    const result = validateMatchComposition({
      matchMode: "ONE_V_ONE",
      sideAPlayerIds: [playerIds[0]],
      sideBPlayerIds: [playerIds[1]],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid 2v2 composition", () => {
    const result = validateMatchComposition({
      matchMode: "TWO_V_TWO",
      sideAPlayerIds: [playerIds[0], playerIds[1]],
      sideBPlayerIds: [playerIds[2], playerIds[3]],
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate players across sides", () => {
    const result = validateMatchComposition({
      matchMode: "TWO_V_TWO",
      sideAPlayerIds: [playerIds[0], playerIds[1]],
      sideBPlayerIds: [playerIds[0], playerIds[3]],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid player count for the match mode", () => {
    const result = validateMatchComposition({
      matchMode: "ONE_V_ONE",
      sideAPlayerIds: [playerIds[0], playerIds[1]],
      sideBPlayerIds: [playerIds[2]],
    });

    expect(result.success).toBe(false);
  });
});
