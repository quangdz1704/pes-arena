import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { isDatabaseConfigured } from "@/db";
import { getActiveMatch, getMatchSetup } from "@/services/match.service";

import { MatchBuilder } from "./match-builder";

export const metadata: Metadata = { title: "Trận mới" };
export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const databaseReady = isDatabaseConfigured();
  const activeMatch = databaseReady ? await getActiveMatch() : null;

  if (activeMatch) redirect(`/matches/${activeMatch.id}`);

  const setup = databaseReady ? await getMatchSetup() : null;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <PageHeading eyebrow="Thi đấu" title="Trận mới" description="Chọn kèo 1v1 hoặc 2v2, random đội và bắt đầu đá PES." />
      {setup ? <MatchBuilder setup={setup} /> : <DatabaseSetupNotice />}
    </div>
  );
}
