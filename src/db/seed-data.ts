export type TeamSeed = {
  name: string;
  shortName: string;
  type: "CLUB" | "NATIONAL";
  tier: "S" | "A" | "B" | "C";
  country: string;
  rating: number;
};

export const topClubSeeds: TeamSeed[] = [
  ["Real Madrid", "RMA", "Spain", "S", 95],
  ["Barcelona", "BAR", "Spain", "S", 93],
  ["Manchester City", "MCI", "England", "S", 94],
  ["Liverpool", "LIV", "England", "S", 92],
  ["Arsenal", "ARS", "England", "S", 91],
  ["Manchester United", "MUN", "England", "A", 87],
  ["Chelsea", "CHE", "England", "A", 88],
  ["Paris Saint-Germain", "PSG", "France", "S", 92],
  ["Bayern Munich", "BAY", "Germany", "S", 93],
  ["Inter Milan", "INT", "Italy", "S", 91],
  ["AC Milan", "MIL", "Italy", "A", 88],
  ["Juventus", "JUV", "Italy", "A", 88],
  ["Atletico Madrid", "ATM", "Spain", "A", 89],
  ["Borussia Dortmund", "BVB", "Germany", "A", 88],
  ["Bayer Leverkusen", "B04", "Germany", "S", 90],
  ["Napoli", "NAP", "Italy", "A", 88],
  ["Roma", "ROM", "Italy", "A", 86],
  ["Tottenham Hotspur", "TOT", "England", "A", 88],
  ["Newcastle United", "NEW", "England", "A", 86],
  ["Aston Villa", "AVL", "England", "A", 87],
  ["RB Leipzig", "RBL", "Germany", "A", 86],
  ["Benfica", "BEN", "Portugal", "A", 86],
  ["Porto", "POR", "Portugal", "A", 85],
  ["Sporting CP", "SCP", "Portugal", "A", 87],
  ["Ajax", "AJA", "Netherlands", "A", 84],
  ["PSV Eindhoven", "PSV", "Netherlands", "A", 86],
  ["Feyenoord", "FEY", "Netherlands", "A", 85],
  ["Galatasaray", "GAL", "Turkey", "A", 84],
  ["Fenerbahce", "FEN", "Turkey", "A", 84],
  ["Al Hilal", "HIL", "Saudi Arabia", "A", 84],
].map(([name, shortName, country, tier, rating]) => ({
  name: name as string,
  shortName: shortName as string,
  type: "CLUB" as const,
  tier: tier as TeamSeed["tier"],
  country: country as string,
  rating: rating as number,
}));

export const midClubSeeds: TeamSeed[] = [
  ["Brighton", "BHA", "England", 82],
  ["West Ham United", "WHU", "England", 82],
  ["Everton", "EVE", "England", 79],
  ["Crystal Palace", "CRY", "England", 80],
  ["Fulham", "FUL", "England", 80],
  ["Wolverhampton", "WOL", "England", 79],
  ["Fiorentina", "FIO", "Italy", 82],
  ["Lazio", "LAZ", "Italy", 83],
  ["Atalanta", "ATA", "Italy", 84],
  ["Bologna", "BOL", "Italy", 82],
  ["Torino", "TOR", "Italy", 79],
  ["Real Sociedad", "RSO", "Spain", 83],
  ["Real Betis", "BET", "Spain", 82],
  ["Villarreal", "VIL", "Spain", 82],
  ["Sevilla", "SEV", "Spain", 81],
  ["Athletic Bilbao", "ATH", "Spain", 84],
  ["Monaco", "ASM", "France", 83],
  ["Marseille", "OM", "France", 82],
  ["Lyon", "OL", "France", 80],
  ["Lille", "LIL", "France", 82],
].map(([name, shortName, country, rating]) => ({
  name: name as string,
  shortName: shortName as string,
  type: "CLUB" as const,
  tier: "B" as const,
  country: country as string,
  rating: rating as number,
}));

export const nationalTeamSeeds: TeamSeed[] = [
  ["Argentina", "ARG", "Argentina", "S", 94],
  ["Brazil", "BRA", "Brazil", "S", 93],
  ["France", "FRA", "France", "S", 94],
  ["England", "ENG", "England", "S", 92],
  ["Spain", "ESP", "Spain", "S", 93],
  ["Germany", "GER", "Germany", "S", 91],
  ["Portugal", "POR-N", "Portugal", "S", 92],
  ["Netherlands", "NED", "Netherlands", "A", 90],
  ["Italy", "ITA", "Italy", "A", 90],
  ["Belgium", "BEL", "Belgium", "A", 88],
  ["Uruguay", "URU", "Uruguay", "A", 88],
  ["Croatia", "CRO", "Croatia", "A", 88],
  ["Denmark", "DEN", "Denmark", "A", 85],
  ["Switzerland", "SUI", "Switzerland", "A", 85],
  ["Colombia", "COL", "Colombia", "A", 87],
  ["Mexico", "MEX", "Mexico", "B", 83],
  ["United States", "USA", "United States", "B", 82],
  ["Japan", "JPN", "Japan", "B", 83],
  ["South Korea", "KOR", "South Korea", "B", 82],
  ["Morocco", "MAR", "Morocco", "A", 86],
  ["Senegal", "SEN", "Senegal", "B", 84],
  ["Nigeria", "NGA", "Nigeria", "B", 83],
  ["Cameroon", "CMR", "Cameroon", "B", 81],
  ["Vietnam", "VIE", "Vietnam", "C", 72],
].map(([name, shortName, country, tier, rating]) => ({
  name: name as string,
  shortName: shortName as string,
  type: "NATIONAL" as const,
  tier: tier as TeamSeed["tier"],
  country: country as string,
  rating: rating as number,
}));

export const teamSeeds = [
  ...topClubSeeds,
  ...midClubSeeds,
  ...nationalTeamSeeds,
];

export const defaultPoolSeeds = [
  {
    name: "CLB hàng đầu",
    emoji: "🔥",
    description: "Những CLB mạnh nhất cho các kèo căng.",
  },
  {
    name: "CLB tầm trung",
    emoji: "⚽",
    description: "Đá bằng tay, không chỉ bằng chỉ số.",
  },
  {
    name: "Đội tuyển quốc gia",
    emoji: "🌍",
    description: "Các đội tuyển quốc gia nổi bật.",
  },
  {
    name: "Tất cả",
    emoji: "🎲",
    description: "Không giới hạn. Random đi, đừng chọn Real nữa.",
  },
] as const;
