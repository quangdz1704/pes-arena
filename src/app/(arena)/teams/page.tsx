import type { Metadata } from "next";

import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { isDatabaseConfigured } from "@/db";
import { listTeamPools } from "@/services/team-pool.service";
import { listTeams } from "@/services/team.service";

import { TeamManager } from "./team-manager";

export const metadata: Metadata = { title: "Đội bóng" };
export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const databaseReady = isDatabaseConfigured();
  const [teams, pools] = databaseReady
    ? await Promise.all([listTeams(), listTeamPools()])
    : [[], []];

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Quản lý"
        title="Đội bóng & nhóm đội"
        description="Xây pool random theo tier và rating. Logic pool nằm hoàn toàn trong database, không hardcode ở giao diện."
      />
      {databaseReady ? <TeamManager teams={teams} pools={pools} /> : <DatabaseSetupNotice />}
    </div>
  );
}
