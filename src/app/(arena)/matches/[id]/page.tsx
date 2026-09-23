import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { isDatabaseConfigured } from "@/db";
import { getMatch } from "@/services/match.service";

import { MatchScoreboard } from "./match-scoreboard";

export const metadata: Metadata = { title: "Trận đấu" };
export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const databaseReady = isDatabaseConfigured();
  const { id } = await params;
  const match = databaseReady ? await getMatch(id) : null;

  if (databaseReady && !match) notFound();

  return <div className="mx-auto max-w-3xl space-y-7"><PageHeading eyebrow="Thi đấu" title={match?.status === "FINISHED" ? "Kết quả trận đấu" : "Trận đang diễn ra"} description={match?.matchMode === "TWO_V_TWO" ? "Kèo 2v2 — phối hợp cho mượt rồi hãy gáy." : "Kèo 1v1 — bản lĩnh nói bằng tỉ số."} />{match ? <MatchScoreboard match={match} /> : <DatabaseSetupNotice />}</div>;
}
