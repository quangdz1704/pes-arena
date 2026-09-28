import "server-only";

import { buildArenaNews } from "./arena-news";
import { listMatchHistory } from "./match.service";
import { getTournament, listTournaments } from "./tournament.service";

export async function getArenaNews() {
  const [matches, tournaments] = await Promise.all([
    listMatchHistory(),
    listTournaments(),
  ]);
  const completedTournaments = await Promise.all(
    tournaments
      .filter((tournament) => tournament.status === "FINISHED")
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .slice(0, 5)
      .map((tournament) => getTournament(tournament.id)),
  );

  return buildArenaNews({
    matches,
    tournaments: completedTournaments.filter(
      (tournament): tournament is NonNullable<typeof tournament> => Boolean(tournament),
    ),
  });
}
