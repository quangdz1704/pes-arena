import "server-only";

import { z } from "zod";

import { sendMatchResultToDiscord } from "@/lib/discord/match-result";
import {
  createPlayingMatchRecord,
  finishMatchRecord,
  getMatchRecord,
  getMatchSetupRecords,
  listActiveMatchRecords,
  listMatchHistoryRecords,
  updatePlayingMatchScoreRecord,
} from "@/repositories/match.repository";
import {
  finishTournamentIfComplete,
  getTournamentFixtureForMatchStart,
} from "@/repositories/tournament.repository";

import { matchCompositionSchema } from "./match-composition";

export const startMatchInputSchema = z.object({
  composition: matchCompositionSchema,
  teamPoolId: z.uuid(),
  randomMode: z.enum(["PURE", "BALANCED"]).nullable(),
  sideATeamId: z.uuid(),
  sideBTeamId: z.uuid(),
  sideARerollCount: z.coerce.number().int().min(0).max(99).default(0),
  sideBRerollCount: z.coerce.number().int().min(0).max(99).default(0),
  isRanked: z.boolean().default(true),
  tournamentFixtureId: z.uuid().optional(),
});

const matchNoteInputSchema = z.object({
  playerId: z.uuid(),
  content: z.string().trim().min(1).max(500),
});

export const finishMatchInputSchema = z.object({
  matchId: z.uuid(),
  sideAScore: z.coerce.number().int().min(0).max(99),
  sideBScore: z.coerce.number().int().min(0).max(99),
  notes: z.array(matchNoteInputSchema).max(4),
}).superRefine((value, context) => {
  if (new Set(value.notes.map((note) => note.playerId)).size !== value.notes.length) {
    context.addIssue({ code: "custom", path: ["notes"], message: "Mỗi người chỉ có một ghi chú." });
  }
});

export const updateMatchScoreInputSchema = z.object({
  matchId: z.uuid(),
  sideAScore: z.coerce.number().int().min(0).max(99),
  sideBScore: z.coerce.number().int().min(0).max(99),
});

export type StartMatchInput = z.infer<typeof startMatchInputSchema>;

export async function getMatchSetup() {
  return getMatchSetupRecords();
}

export async function startMatch(input: StartMatchInput) {
  const setup = await getMatchSetupRecords();
  const playerIds = new Set(setup.players.map((player) => player.id));
  const allSelectedPlayerIds = [
    ...input.composition.sideAPlayerIds,
    ...input.composition.sideBPlayerIds,
  ];

  if (!allSelectedPlayerIds.every((playerId) => playerIds.has(playerId))) {
    throw new Error("Chỉ có thể chọn người chơi đang hoạt động.");
  }

  const pool = setup.pools.find((item) => item.id === input.teamPoolId);
  if (!pool) throw new Error("Nhóm đội không tồn tại hoặc đang bị ẩn.");
  if (input.sideATeamId === input.sideBTeamId) {
    throw new Error("Hai bên phải dùng hai đội bóng khác nhau.");
  }

  const sideATeam = pool.teams.find((team) => team.id === input.sideATeamId);
  const sideBTeam = pool.teams.find((team) => team.id === input.sideBTeamId);
  if (!sideATeam || !sideBTeam) {
    throw new Error("Đội bóng phải thuộc nhóm đội đã chọn.");
  }
  if (
    input.randomMode === "BALANCED" &&
    sideATeam.tier !== sideBTeam.tier &&
    Math.abs(sideATeam.rating - sideBTeam.rating) > 7
  ) {
    throw new Error("Hai đội cân bằng cần cùng tier hoặc có rating gần nhau.");
  }

  let tournamentId: string | undefined;
  if (input.tournamentFixtureId) {
    const fixture = await getTournamentFixtureForMatchStart(input.tournamentFixtureId);
    if (!fixture || fixture.matchId) {
      throw new Error("Lịch đấu không tồn tại hoặc đã được bắt đầu.");
    }
    if (fixture.tournamentStatus !== "ACTIVE") {
      throw new Error("Giải đấu này không còn diễn ra.");
    }
    if (input.composition.matchMode !== fixture.matchMode) {
      throw new Error("Chế độ trận không khớp với giải đấu.");
    }
    const samePlayers = (actual: string[], expected: string[]) =>
      actual.length === expected.length && actual.every((id) => expected.includes(id));
    if (
      !samePlayers(input.composition.sideAPlayerIds, fixture.homePlayerIds) ||
      !samePlayers(input.composition.sideBPlayerIds, fixture.awayPlayerIds)
    ) {
      throw new Error("Tuyển thủ của trận phải đúng theo lịch thi đấu.");
    }
    tournamentId = fixture.tournamentId;
  }

  return createPlayingMatchRecord({
    matchMode: input.composition.matchMode,
    teamPoolId: input.teamPoolId,
    randomMode: input.randomMode,
    isRanked: input.isRanked,
    sideAPlayerIds: input.composition.sideAPlayerIds,
    sideBPlayerIds: input.composition.sideBPlayerIds,
    sideATeamId: input.sideATeamId,
    sideBTeamId: input.sideBTeamId,
    sideARerollCount: input.sideARerollCount,
    sideBRerollCount: input.sideBRerollCount,
    tournamentId,
    tournamentFixtureId: input.tournamentFixtureId,
  });
}

export async function getMatch(id: string) {
  return getMatchRecord(id);
}

export async function listActiveMatches() {
  return listActiveMatchRecords();
}

export async function listMatchHistory() {
  return listMatchHistoryRecords();
}

export async function finishMatch(input: z.infer<typeof finishMatchInputSchema>) {
  const currentMatch = await getMatchRecord(input.matchId);
  if (!currentMatch || currentMatch.status !== "PLAYING") {
    throw new Error("Trận đấu không tồn tại hoặc đã được lưu kết quả.");
  }

  const participantIds = new Set(
    currentMatch.sides.flatMap((side) => side.players.map((player) => player.id)),
  );
  if (!input.notes.every((note) => participantIds.has(note.playerId))) {
    throw new Error("Ghi chú chỉ dành cho người đã tham gia trận đấu.");
  }

  await finishMatchRecord(input.matchId, input.sideAScore, input.sideBScore, input.notes);
  if (currentMatch.tournamentId) await finishTournamentIfComplete(currentMatch.tournamentId);
  const finishedMatch = await getMatchRecord(input.matchId);
  if (!finishedMatch) throw new Error("Không thể tải lại kết quả trận đấu.");

  const discordStatus = await sendMatchResultToDiscord(finishedMatch);
  return { match: finishedMatch, discordStatus };
}

export async function updatePlayingMatchScore(input: z.infer<typeof updateMatchScoreInputSchema>) {
  await updatePlayingMatchScoreRecord(input.matchId, input.sideAScore, input.sideBScore);
}
