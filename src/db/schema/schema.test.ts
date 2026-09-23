import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { matchSidePlayers, matchSides } from "./matches";

describe("match schema invariants", () => {
  it("allows only one A and one B side per match", () => {
    const config = getTableConfig(matchSides);
    const constraint = config.uniqueConstraints.find(
      (item) => item.getName() === "match_sides_match_side_unique",
    );

    expect(constraint?.columns.map((column) => column.name)).toEqual([
      "match_id",
      "side",
    ]);
  });

  it("prevents a player from appearing twice in one match", () => {
    const config = getTableConfig(matchSidePlayers);
    const constraint = config.uniqueConstraints.find(
      (item) => item.getName() === "match_side_players_match_player_unique",
    );

    expect(constraint?.columns.map((column) => column.name)).toEqual([
      "match_id",
      "player_id",
    ]);
  });

  it("ties a side player to a side from the same match", () => {
    const config = getTableConfig(matchSidePlayers);
    const foreignKey = config.foreignKeys.find(
      (item) => item.getName() === "match_side_players_side_match_fk",
    );
    const reference = foreignKey?.reference();

    expect(reference?.columns.map((column) => column.name)).toEqual([
      "match_side_id",
      "match_id",
    ]);
    expect(reference?.foreignColumns.map((column) => column.name)).toEqual([
      "id",
      "match_id",
    ]);
  });
});
