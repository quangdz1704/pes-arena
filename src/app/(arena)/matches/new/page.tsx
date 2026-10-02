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
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeading eyebrow="Thi đấu" title="Tạo trận" description="Chọn người, chọn đội. Chốt kèo và vào sân." />
      {setup ? <MatchBuilder setup={setup} tournamentFixture={tournamentFixture} /> : <DatabaseSetupNotice />}
    </div>
  );
}
