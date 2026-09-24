import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "./index";
import { teamSeeds } from "./seed-data";
import { teams } from "./schema";

async function syncTeamLogos() {
  const db = getDb();
  const logoSeeds = teamSeeds.filter(
    (team): team is typeof team & { logoUrl: string } => Boolean(team.logoUrl),
  );

  const updates = await Promise.all(
    logoSeeds.map((team) =>
      db
        .update(teams)
        .set({ logoUrl: team.logoUrl, updatedAt: new Date() })
        .where(and(eq(teams.name, team.name), isNull(teams.logoUrl)))
        .returning({ id: teams.id }),
    ),
  );

  console.info(`Đã bổ sung logo cho ${updates.flat().length} đội chưa có logo.`);
}

syncTeamLogos().catch((error: unknown) => {
  console.error("Đồng bộ logo đội bóng thất bại.", error);
  process.exitCode = 1;
});
