import type { Metadata } from "next";

import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { isDatabaseConfigured } from "@/db";
import { getMatchSetup } from "@/services/match.service";
import { getTournamentFixtureForStart } from "@/services/tournament.service";

import { MatchBuilder } from "./match-builder";

export const metadata: Metadata = { title: "Trận mới" };
export const dynamic = "force-dynamic";

export default async function NewMatchPage({ searchParams }: { searchParams: Promise<{ fixture?: string }> }) {
  const databaseReady = isDatabaseConfigured();
  const { fixture } = await searchParams;
  const [setup, tournamentFixture] = databaseReady
    ? await Promise.all([getMatchSetup(), fixture ? getTournamentFixtureForStart(fixture) : Promise.resolve(null)])
    : [null, null];

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <PageHeading eyebrow="Thi đấu" title="Trận mới" description="Chọn kèo 1v1 hoặc 2v2, random đội và bắt đầu đá PES." />
      {setup ? <MatchBuilder setup={setup} tournamentFixture={tournamentFixture} /> : <DatabaseSetupNotice />}
    </div>
  );
}
