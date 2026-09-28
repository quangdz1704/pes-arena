import { describe, expect, it } from "vitest";

import { getArenaRank } from "./arena-rank";

describe("Arena rank tiers", () => {
  it("uses the configured labels and colours at every rating threshold", () => {
    expect(getArenaRank(999)).toMatchObject({ label: "Tân binh", tone: "text-muted-foreground" });
    expect(getArenaRank(1000)).toMatchObject({ label: "Ao làng", tone: "text-primary" });
    expect(getArenaRank(1100)).toMatchObject({ label: "Chuyên nghiệp", tone: "text-violet-300" });
    expect(getArenaRank(1200)).toMatchObject({ label: "Thế giới", tone: "text-sky-300" });
    expect(getArenaRank(1350)).toMatchObject({ label: "Siêu sao", tone: "text-fuchsia-300" });
    expect(getArenaRank(1500)).toMatchObject({ label: "Huyền thoại", tone: "text-amber-300" });
  });
});
