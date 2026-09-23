import { afterEach, describe, expect, it, vi } from "vitest";

import type { MatchDetailDto } from "@/repositories/match.repository";

import { sendMatchResultToDiscord } from "./match-result";

const match: MatchDetailDto = {
  id: "00000000-0000-4000-8000-000000000001",
  matchMode: "ONE_V_ONE",
  status: "FINISHED",
  randomMode: "BALANCED",
  isRanked: true,
  playedAt: "2026-09-23T10:00:00.000Z",
  createdAt: "2026-09-23T09:00:00.000Z",
  sides: [
    { id: "a", side: "A", score: 5, rerollCount: 0, team: { id: "ta", name: "Arsenal", shortName: "ARS", tier: "A", rating: 87 }, players: [{ id: "p1", name: "Quang", nickname: null, avatarUrl: null }] },
    { id: "b", side: "B", score: 1, rerollCount: 0, team: { id: "tb", name: "Chelsea", shortName: "CHE", tier: "A", rating: 86 }, players: [{ id: "p2", name: "Nam", nickname: null, avatarUrl: null }] },
  ],
  notes: [],
};

describe("sendMatchResultToDiscord", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DISCORD_WEBHOOK_URL;
  });

  it("does not send a request when the webhook is absent", async () => {
    const previousWebhook = process.env.DISCORD_WEBHOOK_URL;
    delete process.env.DISCORD_WEBHOOK_URL;

    await expect(sendMatchResultToDiscord(match)).resolves.toBe("not_configured");

    if (previousWebhook) process.env.DISCORD_WEBHOOK_URL = previousWebhook;
  });

  it("sends the fallback text when no player leaves a note", async () => {
    process.env.DISCORD_WEBHOOK_URL = "https://discord.example/webhook";
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendMatchResultToDiscord(match)).resolves.toBe("sent");

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body));
    expect(payload.allowed_mentions).toEqual({ parse: [] });
    expect(payload.embeds[0].fields).toContainEqual({
      name: "💬 Cảm nhận sau trận",
      value: "K còn gì để nói.",
    });
  });
});
