export type TeamSeed = {
  name: string;
  shortName: string;
  logoUrl?: string | null;
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

// data from https://football-logos.cc/
const defaultTeamLogoUrls: Record<string, string> = {
  "Real Madrid":
    "https://assets.football-logos.cc/logos/spain/256x256/real-madrid.5ce15611.png",
  Barcelona:
    "https://assets.football-logos.cc/logos/spain/256x256/barcelona.481f5fb3.png",
  "Manchester City":
    "https://assets.football-logos.cc/logos/england/256x256/manchester-city.62f9d1f2.png",
  Liverpool:
    "https://assets.football-logos.cc/logos/england/256x256/liverpool.99c48ae3.png",
  Arsenal:
    "https://assets.football-logos.cc/logos/england/256x256/arsenal.e5528ede.png",
  "Manchester United":
    "https://assets.football-logos.cc/logos/england/256x256/manchester-united.7ab9d343.png",
  Chelsea:
    "https://assets.football-logos.cc/logos/england/256x256/chelsea.ede8a2a7.png",
  "Paris Saint-Germain":
    "https://assets.football-logos.cc/logos/france/256x256/paris-saint-germain.7d591ccb.png",
  "Bayern Munich":
    "https://assets.football-logos.cc/logos/germany/256x256/bayern-munchen.6c38f13a.png",
  "Inter Milan":
    "https://assets.football-logos.cc/logos/italy/256x256/inter.3a7ce90c.png",
  "AC Milan":
    "https://assets.football-logos.cc/logos/italy/256x256/milan.75d56f90.png",
  Juventus:
    "https://assets.football-logos.cc/logos/italy/256x256/juventus.a8baf848.png",
  "Atletico Madrid":
    "https://assets.football-logos.cc/logos/spain/256x256/atletico-madrid.ba72e2cf.png",
  "Borussia Dortmund":
    "https://assets.football-logos.cc/logos/germany/256x256/borussia-dortmund.09ffedcd.png",
  "Bayer Leverkusen":
    "https://assets.football-logos.cc/logos/germany/256x256/bayer-leverkusen.72f211d8.png",
  Napoli:
    "https://assets.football-logos.cc/logos/italy/256x256/napoli.ee47a50b.png",
  Roma: "https://assets.football-logos.cc/logos/italy/256x256/roma.034a933e.png",
  "Tottenham Hotspur":
    "https://assets.football-logos.cc/logos/england/256x256/tottenham.f192bf50.png",
  "Newcastle United":
    "https://assets.football-logos.cc/logos/england/256x256/newcastle.53b65b3d.png",
  "Aston Villa":
    "https://assets.football-logos.cc/logos/england/256x256/aston-villa.07a2646c.png",
  "RB Leipzig":
    "https://assets.football-logos.cc/logos/germany/256x256/rb-leipzig.9d65faeb.png",
  Benfica:
    "https://assets.football-logos.cc/logos/portugal/256x256/benfica.3e4d3034.png",
  Porto:
    "https://assets.football-logos.cc/logos/portugal/256x256/fc-porto.b58f31f6.png",
  "Sporting CP":
    "https://assets.football-logos.cc/logos/portugal/256x256/sporting-cp.8b32e971.png",
  Ajax: "https://assets.football-logos.cc/logos/netherlands/256x256/ajax.fadc62c4.png",
  "PSV Eindhoven":
    "https://assets.football-logos.cc/logos/netherlands/256x256/psv.b5ebd0db.png",
  Feyenoord:
    "https://assets.football-logos.cc/logos/netherlands/256x256/feyenoord.06e393bc.png",
  Galatasaray:
    "https://assets.football-logos.cc/logos/turkey/256x256/galatasaray.b788795f.png",
  Fenerbahce:
    "https://assets.football-logos.cc/logos/turkey/256x256/fenerbahce.2a1e22fd.png",
  "Al Hilal":
    "https://assets.football-logos.cc/logos/saudi-arabia/256x256/al-hilal.fc7a4d70.png",
  Brighton:
    "https://assets.football-logos.cc/logos/england/256x256/brighton.5da206a0.png",
  "West Ham United":
    "https://assets.football-logos.cc/logos/england/256x256/west-ham.c86eebf5.png",
  Everton:
    "https://assets.football-logos.cc/logos/england/256x256/everton.6b635cd7.png",
  "Crystal Palace":
    "https://assets.football-logos.cc/logos/england/256x256/crystal-palace.53067b96.png",
  Fulham:
    "https://assets.football-logos.cc/logos/england/256x256/fulham.4c7ce48b.png",
  Wolverhampton:
    "https://assets.football-logos.cc/logos/england/256x256/wolves.2c773758.png",
  Fiorentina:
    "https://assets.football-logos.cc/logos/italy/256x256/fiorentina.7ba101c2.png",
  Lazio:
    "https://assets.football-logos.cc/logos/italy/256x256/lazio.2386d28d.png",
  Atalanta:
    "https://assets.football-logos.cc/logos/italy/256x256/atalanta.45225436.png",
  Bologna:
    "https://assets.football-logos.cc/logos/italy/256x256/bologna.a78d435f.png",
  Torino:
    "https://assets.football-logos.cc/logos/italy/256x256/torino.a6c78dd6.png",
  "Real Sociedad":
    "https://assets.football-logos.cc/logos/spain/256x256/real-sociedad.501e3b1e.png",
  "Real Betis":
    "https://assets.football-logos.cc/logos/spain/256x256/real-betis.96fdee2c.png",
  Villarreal:
    "https://assets.football-logos.cc/logos/spain/256x256/villarreal.b0313369.png",
  Sevilla:
    "https://assets.football-logos.cc/logos/spain/256x256/sevilla.b741a6ce.png",
  "Athletic Bilbao":
    "https://assets.football-logos.cc/logos/spain/256x256/athletic-club.e1bfba0c.png",
  Monaco:
    "https://assets.football-logos.cc/logos/france/256x256/as-monaco.51dd5065.png",
  Marseille:
    "https://assets.football-logos.cc/logos/france/256x256/marseille.92b6437c.png",
  Lyon: "https://assets.football-logos.cc/logos/france/256x256/lyon.b44ff7aa.png",
  Lille:
    "https://assets.football-logos.cc/logos/france/256x256/lille.451f5326.png",
  Argentina:
    "https://assets.football-logos.cc/logos/argentina/256x256/argentina-national-team.7041952f.png",
  Brazil:
    "https://assets.football-logos.cc/logos/brazil/256x256/brazil-national-team.fd8ca234.png",
  France:
    "https://assets.football-logos.cc/logos/france/256x256/france-national-team.cc82cdbf.png",
  England:
    "https://assets.football-logos.cc/logos/england/256x256/england-national-team.1dd4fab6.png",
  Spain:
    "https://assets.football-logos.cc/logos/spain/256x256/spain-national-team.a42d399e.png",
  Germany:
    "https://assets.football-logos.cc/logos/germany/256x256/germany-national-team.6c5e7edf.png",
  Portugal:
    "https://assets.football-logos.cc/logos/portugal/256x256/portuguese-football-federation.c4cbf0cb.png",
  Netherlands:
    "https://assets.football-logos.cc/logos/netherlands/256x256/dutch-national-team.3fd62267.png",
  Italy:
    "https://assets.football-logos.cc/logos/italy/256x256/italy-national-team.e86a120c.png",
  Belgium:
    "https://assets.football-logos.cc/logos/belgium/256x256/belgium-national-team.28a4fd00.png",
  Uruguay:
    "https://assets.football-logos.cc/logos/uruguay/256x256/uruguay-national-team.f4de4cd6.png",
  Croatia:
    "https://assets.football-logos.cc/logos/croatia/256x256/croatia-national-team.585829ca.png",
  Denmark:
    "https://assets.football-logos.cc/logos/denmark/256x256/denmark-national-team.9d5a1b50.png",
  Switzerland:
    "https://assets.football-logos.cc/logos/switzerland/256x256/switzerland-national-team.4c74693e.png",
  Colombia:
    "https://assets.football-logos.cc/logos/colombia/256x256/colombia-national-team.13fd3fdf.png",
  Mexico:
    "https://assets.football-logos.cc/logos/mexico/256x256/mexico-national-team.11d7d44f.png",
  "United States":
    "https://assets.football-logos.cc/logos/usa/256x256/usa-national-team.ea8d4ff6.png",
  Japan:
    "https://assets.football-logos.cc/logos/japan/256x256/japan-national-team.f37cca5f.png",
  "South Korea":
    "https://assets.football-logos.cc/logos/south-korea/256x256/south-korea-national-team.df45204a.png",
  Morocco:
    "https://assets.football-logos.cc/logos/morocco/256x256/morocco-national-team.337d4152.png",
  Senegal:
    "https://assets.football-logos.cc/logos/senegal/256x256/senegal-national-team.c5a83df2.png",
  Nigeria:
    "https://assets.football-logos.cc/logos/nigeria/256x256/nigeria-national-team.c546a290.png",
  Cameroon:
    "https://assets.football-logos.cc/logos/cameroon/256x256/cameroon-national-team.4985f1e1.png",
  Vietnam:
    "https://assets.football-logos.cc/logos/vietnam/256x256/vietnam-national-team.77182a1e.png",
};

export const teamSeeds = [
  ...topClubSeeds,
  ...midClubSeeds,
  ...nationalTeamSeeds,
].map((team) => ({
  ...team,
  logoUrl: defaultTeamLogoUrls[team.name] ?? null,
}));

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
