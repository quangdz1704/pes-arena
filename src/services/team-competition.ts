export type CompetitionTeam = {
  country: string;
  type: "CLUB" | "NATIONAL";
};

const leagueByCountry: Record<string, string> = {
  England: "Ngoại hạng Anh",
  France: "Ligue 1",
  Germany: "Bundesliga",
  Italy: "Serie A",
  Netherlands: "Eredivisie",
  Portugal: "Primeira Liga",
  "Saudi Arabia": "Saudi Pro League",
  Spain: "La Liga",
  Turkey: "Süper Lig",
};

export function getTeamCompetition(team: CompetitionTeam) {
  if (team.type === "NATIONAL") return "Đội tuyển quốc gia";
  return leagueByCountry[team.country] ?? `CLB ${team.country}`;
}

export function listTeamCompetitions<T extends CompetitionTeam>(teams: readonly T[]) {
  return [...new Set(teams.map(getTeamCompetition))].sort((first, second) =>
    first.localeCompare(second, "vi"),
  );
}
